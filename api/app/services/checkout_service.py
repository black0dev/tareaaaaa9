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


VALID_STATES = {
    "pendiente_pago",
    "pagado",
    "en_preparacion",
    "listo_para_entrega",
    "entregado",
    "cancelado",
    "reembolsado",
}


def _generate_order_number() -> str:
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    suffix = uuid.uuid4().hex[:6].upper()
    return f"ORD-{ts}-{suffix}"


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
                f"La variante {variant.name} no esta disponible.",
                {"variant_id": vid},
            )

        variant_label = f"{variant.size} / {variant.color}"
        if variant.stock_quantity < line["quantity"]:
            raise CheckoutError(
                "stock_insufficient",
                f"No hay stock suficiente para la variante '{variant_label}'. "
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
    subtotal_amount = 0
    order_items_data = []

    for line in lines:
        variant, product = variant_map[line["product_variant_id"]]
        variant_label = f"{variant.size} / {variant.color}"
        db_price = variant.price_amount

        if line["unit_price"] != db_price:
            price_changed_errors.append({
                "variant_id": variant.id,
                "variant_name": variant_label,
                "sent_price": line["unit_price"],
                "actual_price": db_price,
            })

        line_subtotal = db_price * line["quantity"]
        subtotal_amount += line_subtotal

        order_items_data.append({
            "product_variant_id": variant.id,
            "product_name": product.name,
            "variant_name": variant_label,
            "sku": variant.sku,
            "quantity": line["quantity"],
            "unit_price": db_price,
            "subtotal": line_subtotal,
        })

    if price_changed_errors:
        raise CheckoutError(
            "price_changed",
            "Uno o mas precios cambiaron. Por favor revisa el carrito nuevamente.",
            {"changes": price_changed_errors},
        )

    total_amount = subtotal_amount
    order_number = _generate_order_number()

    order = Order(
        order_number=order_number,
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        fulfillment_type=fulfillment_type,
        shipping_address_json=shipping_address_json,
        pickup_notes=pickup_notes,
        status="pendiente_pago",
        subtotal_amount=subtotal_amount,
        total_amount=total_amount,
        notes=notes,
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
            delta_quantity=-qty,
            previous_stock_quantity=previous_stock,
            new_stock_quantity=previous_stock - qty,
            reason_type="creacion_pedido",
            created_by_profile_id=None,
        )
        db.add(adjustment)

    status_history = OrderStatusHistory(
        order_id=order.id,
        previous_status=None,
        new_status="pendiente_pago",
        notes="Pedido creado",
    )
    db.add(status_history)

    return order
