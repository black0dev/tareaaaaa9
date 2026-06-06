from datetime import datetime

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Product Admin Schemas
# ---------------------------------------------------------------------------

class AdminProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=220)
    description: str | None = None
    category_id: str | None = None
    material: str | None = Field(None, max_length=100)
    brand: str | None = Field(None, max_length=100)
    base_price: int = Field(0, ge=0)


class AdminProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    slug: str | None = Field(None, min_length=1, max_length=220)
    description: str | None = None
    category_id: str | None = None
    material: str | None = Field(None, max_length=100)
    brand: str | None = Field(None, max_length=100)
    base_price: int | None = Field(None, ge=0)
    is_active: bool | None = None


class AdminProductOut(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None = None
    material: str | None = None
    brand: str | None = None
    base_price: int
    category_id: str | None = None
    category_name: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    variants_count: int = 0
    total_stock: int = 0
    primary_image_url: str | None = None

    model_config = {"from_attributes": True}


class AdminProductListItem(AdminProductOut):
    pass


# ---------------------------------------------------------------------------
# Variant Admin Schemas
# ---------------------------------------------------------------------------

class AdminVariantCreate(BaseModel):
    size: str = Field(..., min_length=1, max_length=10)
    color: str = Field(..., min_length=1, max_length=50)
    price_amount: int = Field(0, ge=0)
    stock_quantity: int = Field(0, ge=0)
    sku: str = Field(..., min_length=1, max_length=50)


class AdminVariantUpdate(BaseModel):
    size: str | None = Field(None, min_length=1, max_length=10)
    color: str | None = Field(None, min_length=1, max_length=50)
    price_amount: int | None = Field(None, ge=0)
    stock_quantity: int | None = Field(None, ge=0)
    sku: str | None = Field(None, min_length=1, max_length=50)


class AdminVariantOut(BaseModel):
    id: str
    product_id: str
    sku: str
    size: str
    color: str
    price_amount: int
    stock_quantity: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Image Admin Schemas
# ---------------------------------------------------------------------------

class AdminImageOut(BaseModel):
    id: str
    product_id: str
    url: str
    alt_text: str | None = None
    sort_order: int
    is_primary: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Order Admin Schemas
# ---------------------------------------------------------------------------

class AdminOrderItemOut(BaseModel):
    id: str
    product_name: str
    variant_name: str
    sku: str
    quantity: int
    unit_price: int
    subtotal: int

    model_config = {"from_attributes": True}


class AdminPaymentOut(BaseModel):
    id: str
    amount: int
    method: str
    reference: str | None = None
    status: str
    confirmed_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminStatusHistoryOut(BaseModel):
    id: str
    previous_status: str | None = None
    new_status: str
    notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminOrderListItem(BaseModel):
    id: str
    order_number: str
    customer_name: str
    customer_email: str
    customer_phone: str
    status: str
    fulfillment_type: str
    total_amount: int
    created_at: datetime
    payment_status: str | None = None

    model_config = {"from_attributes": True}


class AdminOrderDetail(BaseModel):
    id: str
    order_number: str
    customer_name: str
    customer_email: str
    customer_phone: str
    status: str
    fulfillment_type: str
    shipping_address_json: dict | None = None
    pickup_notes: str | None = None
    subtotal_amount: int
    total_amount: int
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
    items: list[AdminOrderItemOut] = []
    payments: list[AdminPaymentOut] = []
    status_history: list[AdminStatusHistoryOut] = []

    model_config = {"from_attributes": True}
