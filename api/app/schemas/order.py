from pydantic import BaseModel, Field


class StatusTransitionRequest(BaseModel):
    new_status: str = Field(
        pattern=r"^(pendiente_pago|pagado|en_preparacion|listo_para_entrega|entregado|cancelado|reembolsado)$"
    )
    notes: str | None = None


class StatusTransitionResponse(BaseModel):
    order_id: str
    previous_status: str | None
    new_status: str
