from pydantic import BaseModel, EmailStr, Field
from pydantic_extra_types.phone_numbers import PhoneNumber


class OrderLineItem(BaseModel):
    product_variant_id: str
    quantity: int = Field(gt=0)
    unit_price: int = Field(gt=0)


class CreateOrderRequest(BaseModel):
    customer_name: str = Field(min_length=2, max_length=200)
    customer_email: EmailStr
    customer_phone: str = Field(min_length=7, max_length=30)
    fulfillment_type: str = Field(pattern=r"^(shipping|pickup)$")
    shipping_address_json: dict | None = None
    pickup_notes: str | None = None
    lines: list[OrderLineItem] = Field(min_length=1)
    notes: str | None = None


class CreateOrderResponse(BaseModel):
    order_id: str
    order_number: str
    status: str
    total_amount: int
