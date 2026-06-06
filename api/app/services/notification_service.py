import json
import logging
import os
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session

logger = logging.getLogger("notification_service")

NOTIFICATIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs")
os.makedirs(NOTIFICATIONS_DIR, exist_ok=True)


async def send_order_notification(order_data: dict[str, Any]) -> None:
    log_entry = {
        "type": "order_notification",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "order_number": order_data.get("order_number"),
        "customer_email": order_data.get("customer_email"),
        "customer_name": order_data.get("customer_name"),
        "total_amount": order_data.get("total_amount"),
        "status": order_data.get("status"),
        "fulfillment_type": order_data.get("fulfillment_type"),
    }

    log_path = os.path.join(NOTIFICATIONS_DIR, "notifications.jsonl")
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")

    logger.info("order_notification logged: %s", order_data.get("order_number"))

    try:
        async with async_session() as db:
            await _ensure_notifications_table(db)
            await db.execute(
                text(
                    """
                    INSERT INTO notifications (event_type, payload, created_at)
                    VALUES (:event_type, :payload, :created_at)
                    """
                ),
                {
                    "event_type": "order_created",
                    "payload": json.dumps(log_entry, ensure_ascii=False),
                    "created_at": datetime.now(timezone.utc),
                },
            )
            await db.commit()
    except Exception as e:
        logger.warning("notification db insert fallback (log-only): %s", e)


async def _ensure_notifications_table(db: AsyncSession) -> None:
    await db.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                event_type VARCHAR(50) NOT NULL,
                payload JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
    )
