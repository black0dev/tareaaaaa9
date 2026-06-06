from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_admin
from app.models import Order, Profile
from app.schemas.common import APIResponse
from app.schemas.order import StatusTransitionRequest, StatusTransitionResponse
from app.schemas.payment import ManualConfirmationRequest, ManualConfirmationResponse
from app.services.order_service import OrderServiceError, transition_status
from app.services.payment_service import PaymentServiceError, manual_confirm_payment

router = APIRouter(prefix="/admin/orders", tags=["Admin Orders"])


@router.post("/{order_id}/status-transitions", response_model=APIResponse)
async def transition_order_status(
    order_id: str,
    payload: StatusTransitionRequest,
    admin: Profile = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido {order_id} no encontrado",
        )

    try:
        await transition_status(
            db=db,
            order=order,
            new_status=payload.new_status,
            changed_by=admin.id,
            notes=payload.notes,
        )
    except OrderServiceError as e:
        if e.code == "invalid_status_transition":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=e.message,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )

    return APIResponse.success(
        data=StatusTransitionResponse(
            order_id=order.id,
            previous_status=order.status,
            new_status=payload.new_status,
        ).model_dump()
    )


@router.post("/{order_id}/payments/manual-confirmation", response_model=APIResponse)
async def manual_payment_confirmation(
    order_id: str,
    payload: ManualConfirmationRequest,
    admin: Profile = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido {order_id} no encontrado",
        )

    try:
        result_data = await manual_confirm_payment(
            db=db,
            order=order,
            admin_profile_id=admin.id,
            reference=payload.reference,
            notes=payload.notes,
        )
    except PaymentServiceError as e:
        if e.code == "payment_already_confirmed":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=e.message,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )

    return APIResponse.success(
        data=ManualConfirmationResponse(**result_data).model_dump()
    )
