from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.checkout import CreateOrderRequest, CreateOrderResponse
from app.schemas.common import APIResponse
from app.services.checkout_service import CheckoutError, create_order

router = APIRouter(prefix="/checkout", tags=["Checkout"])

STATUS_CODE_MAP = {
    "variant_not_found": status.HTTP_400_BAD_REQUEST,
    "variant_inactive": status.HTTP_400_BAD_REQUEST,
    "stock_insufficient": status.HTTP_409_CONFLICT,
    "price_changed": status.HTTP_409_CONFLICT,
    "invalid_delivery_data": status.HTTP_422_UNPROCESSABLE_ENTITY,
}


@router.post("/orders", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_checkout_order(
    request: Request,
    payload: CreateOrderRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        lines = [line.model_dump() for line in payload.lines]

        order = await create_order(
            db=db,
            customer_name=payload.customer_name,
            customer_email=payload.customer_email,
            customer_phone=payload.customer_phone,
            fulfillment_type=payload.fulfillment_type,
            lines=lines,
            shipping_address_json=payload.shipping_address_json,
            pickup_notes=payload.pickup_notes,
            notes=payload.notes,
        )

        return APIResponse.success(
            data=CreateOrderResponse(
                order_id=order.id,
                order_number=order.order_number,
                status=order.status,
                total_amount=order.total_amount,
            ).model_dump(),
        )

    except CheckoutError as e:
        http_status = STATUS_CODE_MAP.get(e.code, status.HTTP_400_BAD_REQUEST)
        return JSONResponse(
            status_code=http_status,
            content=APIResponse.fail(
                code=e.code,
                message=e.message,
                details=e.details,
            ).model_dump(),
        )
