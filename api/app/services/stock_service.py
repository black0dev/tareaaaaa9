from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ProductVariant, StockAdjustment


class StockServiceError(Exception):
    def __init__(self, code: str, message: str, details: dict[str, Any] | None = None):
        self.code = code
        self.message = message
        self.details = details or {}


async def adjust_stock(
    db: AsyncSession,
    variant_id: str,
    adjustment: int,
    admin_profile_id: str,
    notes: str | None = None,
) -> dict:
    result = await db.execute(
        select(ProductVariant).where(ProductVariant.id == variant_id)
    )
    variant = result.scalar_one_or_none()

    if variant is None:
        raise StockServiceError(
            "variant_not_found",
            f"No se encontro la variante con id {variant_id}.",
        )

    previous_stock = variant.stock_quantity
    new_stock = previous_stock + adjustment

    if new_stock < 0:
        raise StockServiceError(
            "negative_stock_not_allowed",
            f"No se permite stock negativo. Stock actual: {previous_stock}, "
            f"ajuste solicitado: {adjustment}, stock resultante: {new_stock}.",
            {
                "variant_id": variant_id,
                "previous_stock": previous_stock,
                "adjustment": adjustment,
                "resulting_stock": new_stock,
            },
        )

    await db.execute(
        update(ProductVariant)
        .where(ProductVariant.id == variant_id)
        .values(stock_quantity=new_stock)
    )

    adjustment_record = StockAdjustment(
        variant_id=variant_id,
        reason_type="ajuste_manual_admin",
        delta_quantity=adjustment,
        previous_stock_quantity=previous_stock,
        new_stock_quantity=new_stock,
        notes=notes,
        created_by_profile_id=admin_profile_id,
    )
    db.add(adjustment_record)

    return {
        "variant_id": variant_id,
        "previous_stock": previous_stock,
        "adjustment": adjustment,
        "new_stock": new_stock,
    }
