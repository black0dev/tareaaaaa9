import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Order,
    OrderItem,
    OrderStatusHistory,
    Product,
    ProductVariant,
    StockAdjustment,
)


def _generate_order_number() -> str:
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    suffix = uuid.uuid4().hex[:6].upper()
    return f"ORD-{ts}-{suffix}"


def _variant_label(variant: ProductVariant) -> str:
    return f"{variant.size} / {variant.color}" if variant.color else variant.size


class CheckoutError(Exception):
    def __init__(self, code: str, message: str, details: dict[str, Any] | None = None):
        self.code = code
        self.message = message
        self.details = details or {}


async def _fetch_and_validate_variants(
    db: AsyncSession, lines: list[dict]
) -> list[dict]:
    variant_ids = [line["product_variant_id"] for line in lines]
    result = await db.execute(
        select(ProductVariant, Product.name.label("product_name"), Product.is_active.label("product_active"))
        .join(Product, ProductVariant.product_id == Product.id)
        .where(ProductVariant.id.in_(variant_ids))
    )
    rows = result.all()

    found_by_id: dict[str, Any] = {}
    for variant, prod_name, prod_active in rows:
        found_by_id[variant.id] = {
            "variant": variant,
            "product_name": prod_name,
            "product_active": prod_active,
        }

    validated = []
    for line in lines:
        vid = line["product_variant_id"]
        if vid not in found_by_id:
            raise CheckoutError(
                "variant_not_found",
                f"La variante {vid} no existe.",
                {"variant_id": vid},
            )
        entry = found_by_id[vid]
        variant = entry["variant"]

        if not variant.is_active or not entry["product_active"]:
            raise CheckoutError(
                "variant_inactive",
                f"La variante {_variant_label(variant)} no esta disponible.",
                {"variant_id": vid},
            )

        if variant.stock_quantity < line["quantity"]:
            raise CheckoutError(
                "stock_insufficient",
                f"No hay stock suficiente para la variante '{_variant_label(variant)}'. "
                f"Solicitado: {line['quantity']}, disponible: {variant.stock_quantity}.",
                {"variant_id": vid, "requested": line["quantity"], "available": variant.stock_quantity},
            )

        validated.append(line)

    return validated


async def create_order(
    db: AsyncSession,
    customer_name: str,
    customer_email: str,
    customer_phone: str,
    fulfillment_type: str,
    lines: list[dict],
    shipping_address_json: dict | None = None,
    pickup_notes: str | None = None,
    notes: str | None = None,
) -> Order:
    if fulfillment_type == "shipping" and not shipping_address_json:
        raise CheckoutError(
            "invalid_delivery_data",
            "Se requiere direccion de envio para pedidos con fulfillment_type 'shipping'.",
        )

    await _fetch_and_validate_variants(db, lines)

    variant_ids = [line["product_variant_id"] for line in lines]
    result = await db.execute(
        select(ProductVariant, Product)
        .join(Product, ProductVariant.product_id == Product.id)
        .where(ProductVariant.id.in_(variant_ids))
    )
    variant_map = {}
    for variant, product in result.all():
        variant_map[variant.id] = (variant, product)

    price_changed_errors = []
    items_subtotal_amount = 0
    order_items_data = []

    for line in lines:
        variant, product = variant_map[line["product_variant_id"]]
        db_price = variant.price_amount

        if line["unit_price"] != db_price:
            price_changed_errors.append({
                "variant_id": variant.id,
                "variant_label": _variant_label(variant),
                "sent_price": line["unit_price"],
                "actual_price": db_price,
            })

        line_subtotal = db_price * line["quantity"]
        items_subtotal_amount += line_subtotal

        order_items_data.append({
            "variant_id": variant.id,
            "product_id": product.id,
            "product_name_snapshot": product.name,
            "variant_label_snapshot": _variant_label(variant),
            "sku_snapshot": variant.sku,
            "quantity": line["quantity"],
            "unit_price_amount": db_price,
            "line_subtotal_amount": line_subtotal,
            "currency_code": variant.currency_code,
        })

    if price_changed_errors:
        raise CheckoutError(
            "price_changed",
            "Uno o mas precios cambiaron. Por favor revisa el carrito nuevamente.",
            {"changes": price_changed_errors},
        )

    total_amount = items_subtotal_amount
    order_number = _generate_order_number()

    order = Order(
        order_number=order_number,
        customer_full_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        fulfillment_type=fulfillment_type,
        shipping_address_json=shipping_address_json,
        pickup_notes=pickup_notes,
        status="pendiente_pago",
        payment_status="pendiente",
        items_subtotal_amount=items_subtotal_amount,
        total_amount=total_amount,
        customer_notes=notes,
    )
    db.add(order)
    await db.flush()

    for item_data in order_items_data:
        order_item = OrderItem(order_id=order.id, **item_data)
        db.add(order_item)

    for line in lines:
        variant_id = line["product_variant_id"]
        variant, _ = variant_map[variant_id]
        qty = line["quantity"]
        previous_stock = variant.stock_quantity

        await db.execute(
            update(ProductVariant)
            .where(ProductVariant.id == variant_id)
            .values(stock_quantity=ProductVariant.stock_quantity - qty)
        )

        adjustment = StockAdjustment(
            variant_id=variant_id,
            order_id=order.id,
            reason_type="creacion_pedido",
            delta_quantity=-qty,
            previous_stock_quantity=previous_stock,
            new_stock_quantity=previous_stock - qty,
        )
        db.add(adjustment)

    status_history = OrderStatusHistory(
        order_id=order.id,
        from_status=None,
        to_status="pendiente_pago",
        change_reason="Pedido creado",
    )
    db.add(status_history)

    return order
