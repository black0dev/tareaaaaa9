from datetime import datetime

from pydantic import BaseModel


class ManualConfirmationRequest(BaseModel):
    reference: str | None = None
    notes: str | None = None


class ManualConfirmationResponse(BaseModel):
    order_id: str
    payment_status: str
    order_status: str
    confirmed_at: datetime | None = None
