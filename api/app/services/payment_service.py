from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Order, Payment, PaymentEvent, OrderStatusHistory


class PaymentServiceError(Exception):
    def __init__(self, code: str, message: str, details: dict[str, Any] | None = None):
        self.code = code
        self.message = message
        self.details = details or {}


async def manual_confirm_payment(
    db: AsyncSession,
    order: Order,
    admin_profile_id: str,
    reference: str | None = None,
    notes: str | None = None,
) -> dict:
    result = await db.execute(
        select(Payment).where(Payment.order_id == order.id)
    )
    payment = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)

    if payment is None:
        payment = Payment(
            order_id=order.id,
            amount=order.total_amount,
            method="transferencia",
            reference=reference,
            status="confirmado",
            confirmed_at=now,
        )
        db.add(payment)
        await db.flush()
    else:
        if payment.status == "confirmado":
            raise PaymentServiceError(
                "payment_already_confirmed",
                "El pago ya fue confirmado anteriormente.",
            )
        payment.status = "confirmado"
        payment.reference = reference or payment.reference
        payment.confirmed_at = now

    event = PaymentEvent(
        payment_id=payment.id,
        event_type="manual_confirmation",
        event_data={"reference": reference, "notes": notes},
        created_by=admin_profile_id,
    )
    db.add(event)

    previous_order_status = order.status
    if order.status == "pendiente_pago":
        order.status = "pagado"

        status_history = OrderStatusHistory(
            order_id=order.id,
            previous_status=previous_order_status,
            new_status="pagado",
            changed_by=admin_profile_id,
            notes="Pago confirmado manualmente por admin",
        )
        db.add(status_history)

    return {
        "order_id": order.id,
        "payment_status": payment.status,
        "order_status": order.status,
        "confirmed_at": payment.confirmed_at,
    }
