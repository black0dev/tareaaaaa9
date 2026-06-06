from pydantic import BaseModel, Field


class StockAdjustmentRequest(BaseModel):
    product_variant_id: str
    adjustment: int = Field(...)
    notes: str | None = None


class StockAdjustmentResponse(BaseModel):
    variant_id: str
    previous_stock: int
    adjustment: int
    new_stock: int
