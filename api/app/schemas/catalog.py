from pydantic import BaseModel


class ProductVariantOut(BaseModel):
    id: str
    size: str
    color: str
    price_amount: int
    stock_quantity: int
    sku: str
    is_active: bool

    model_config = {"from_attributes": True}


class ProductImageOut(BaseModel):
    id: str
    image_url: str
    alt_text: str | None = None
    is_primary: bool
    sort_order: int

    model_config = {"from_attributes": True}


class ProductListItemOut(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None = None
    category_name: str | None = None
    variants: list[ProductVariantOut] = []
    primary_image_url: str | None = None

    model_config = {"from_attributes": True}


class ProductDetailOut(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None = None
    material: str | None = None
    brand: str | None = None
    category_name: str | None = None
    variants: list[ProductVariantOut] = []
    images: list[ProductImageOut] = []
    primary_image_url: str | None = None

    model_config = {"from_attributes": True}


class CategoryOut(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None = None

    model_config = {"from_attributes": True}
