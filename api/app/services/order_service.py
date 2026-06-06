from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Order,
    OrderItem,
    OrderStatusHistory,
    ProductVariant,
    StockAdjustment,
)

ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "pendiente_pago": {"pagado", "cancelado"},
    "pagado": {"en_preparacion", "cancelado", "reembolsado"},
    "en_preparacion": {"listo_para_entrega"},
    "listo_para_entrega": {"entregado"},
    "entregado": set(),
    "cancelado": set(),
    "reembolsado": set(),
}


class OrderServiceError(Exception):
    def __init__(self, code: str, message: str, details: dict[str, Any] | None = None):
        self.code = code
        self.message = message
        self.details = details or {}


async def validate_transition(current_status: str, new_status: str) -> None:
    allowed = ALLOWED_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise OrderServiceError(
            "invalid_status_transition",
            f"No se puede transicionar de '{current_status}' a '{new_status}'. "
            f"Transiciones permitidas desde '{current_status}': {sorted(allowed)}.",
        )


async def _reingress_stock(
    db: AsyncSession, order_id: str, changed_by: str | None = None
) -> None:
    result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order_id)
    )
    items = result.scalars().all()

    for item in items:
        result_var = await db.execute(
            select(ProductVariant).where(ProductVariant.id == item.product_variant_id)
        )
        variant = result_var.scalar_one_or_none()
        if variant is None:
            continue

        previous_stock = variant.stock_quantity
        new_stock = previous_stock + item.quantity

        await db.execute(
            update(ProductVariant)
            .where(ProductVariant.id == item.product_variant_id)
            .values(stock_quantity=ProductVariant.stock_quantity + item.quantity)
        )

        adjustment = StockAdjustment(
            variant_id=item.product_variant_id,
            delta_quantity=item.quantity,
            previous_stock_quantity=previous_stock,
            new_stock_quantity=new_stock,
            reason_type="devolucion_cancelacion",
            created_by_profile_id=changed_by,
        )
        db.add(adjustment)


async def transition_status(
    db: AsyncSession,
    order: Order,
    new_status: str,
    changed_by: str | None = None,
    notes: str | None = None,
) -> Order:
    previous_status = order.status
    await validate_transition(previous_status, new_status)

    if new_status == "cancelado" and previous_status != "reembolsado":
        await _reingress_stock(db, order.id, changed_by)

    order.status = new_status

    status_history = OrderStatusHistory(
        order_id=order.id,
        previous_status=previous_status,
        new_status=new_status,
        changed_by=changed_by,
        notes=notes,
    )
    db.add(status_history)

    return order
