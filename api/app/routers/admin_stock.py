from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_admin
from app.models import Profile
from app.schemas.common import APIResponse
from app.schemas.stock import StockAdjustmentRequest, StockAdjustmentResponse
from app.services.stock_service import StockServiceError, adjust_stock

router = APIRouter(prefix="/admin/stock", tags=["Admin Stock"])


@router.post("/adjustments", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_stock_adjustment(
    payload: StockAdjustmentRequest,
    admin: Profile = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    try:
        result_data = await adjust_stock(
            db=db,
            variant_id=payload.product_variant_id,
            adjustment=payload.adjustment,
            admin_profile_id=admin.id,
            notes=payload.notes,
        )
    except StockServiceError as e:
        status_code_map = {
            "variant_not_found": status.HTTP_404_NOT_FOUND,
            "negative_stock_not_allowed": status.HTTP_409_CONFLICT,
        }
        http_status = status_code_map.get(e.code, status.HTTP_400_BAD_REQUEST)
        raise HTTPException(status_code=http_status, detail=e.message)

    return APIResponse.success(
        data=StockAdjustmentResponse(**result_data).model_dump()
    )
