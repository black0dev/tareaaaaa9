from pydantic import BaseModel


class PublicConfigResponse(BaseModel):
    payment_methods: list[str]
    shipping_cost: int
    delivery_modes: list[str]
