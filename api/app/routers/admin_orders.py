from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_admin
from app.models import Order, Payment, Profile
from app.schemas.admin import (
    AdminOrderDetail,
    AdminOrderItemOut,
    AdminOrderListItem,
    AdminPaymentOut,
    AdminStatusHistoryOut,
)
from app.schemas.common import APIResponse
from app.schemas.order import StatusTransitionRequest, StatusTransitionResponse
from app.schemas.payment import ManualConfirmationRequest, ManualConfirmationResponse
from app.services.order_service import OrderServiceError, transition_status
from app.services.payment_service import PaymentServiceError, manual_confirm_payment

router = APIRouter(prefix="/admin/orders", tags=["Admin Orders"])


# ---------------------------------------------------------------------------
# Order Listing
# ---------------------------------------------------------------------------

@router.get("", response_model=APIResponse)
async def admin_list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    admin: Profile = Depends(get_current_admin),
):
    where_clauses = []

    if status:
        where_clauses.append(Order.status == status)

    count_q = select(func.count(Order.id)).where(*where_clauses)
    total = (await db.execute(count_q)).scalar() or 0

    offset = (page - 1) * page_size
    orders_q = (
        select(Order)
        .where(*where_clauses)
        .options(selectinload(Order.payments))
        .offset(offset)
        .limit(page_size)
        .order_by(Order.created_at.desc())
    )
    result = await db.execute(orders_q)
    orders = result.unique().scalars().all()

    data = []
    for order in orders:
        payment_status = None
        if order.payments:
            payment_status = order.payments[0].status

        data.append(
            AdminOrderListItem(
                id=order.id,
                order_number=order.order_number,
                customer_name=order.customer_name,
                customer_email=order.customer_email,
                customer_phone=order.customer_phone,
                status=order.status,
                fulfillment_type=order.fulfillment_type,
                total_amount=order.total_amount,
                created_at=order.created_at,
                payment_status=payment_status,
            ).model_dump()
        )

    return APIResponse.success(
        data=data,
        meta={
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max((total + page_size - 1) // page_size, 1),
        },
    )


@router.get("/{order_id}", response_model=APIResponse)
async def admin_get_order_detail(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Profile = Depends(get_current_admin),
):
    order_q = (
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.items),
            selectinload(Order.payments),
            selectinload(Order.status_history),
        )
    )
    result = await db.execute(order_q)
    order = result.unique().scalar_one_or_none()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido {order_id} no encontrado",
        )

    items_out = [
        AdminOrderItemOut(
            id=item.id,
            product_name=item.product_name,
            variant_name=item.variant_name,
            sku=item.sku,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.subtotal,
        )
        for item in order.items
    ]

    payments_out = [
        AdminPaymentOut(
            id=p.id,
            amount=p.amount,
            method=p.method,
            reference=p.reference,
            status=p.status,
            confirmed_at=p.confirmed_at,
            created_at=p.created_at,
        )
        for p in order.payments
    ]

    history_out = sorted(
        [
            AdminStatusHistoryOut(
                id=h.id,
                previous_status=h.previous_status,
                new_status=h.new_status,
                notes=h.notes,
                created_at=h.created_at,
            )
            for h in order.status_history
        ],
        key=lambda x: x.created_at,
    )

    detail = AdminOrderDetail(
        id=order.id,
        order_number=order.order_number,
        customer_name=order.customer_name,
        customer_email=order.customer_email,
        customer_phone=order.customer_phone,
        status=order.status,
        fulfillment_type=order.fulfillment_type,
        shipping_address_json=order.shipping_address_json,
        pickup_notes=order.pickup_notes,
        subtotal_amount=order.subtotal_amount,
        total_amount=order.total_amount,
        notes=order.notes,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items_out,
        payments=payments_out,
        status_history=history_out,
    )

    return APIResponse.success(data=detail.model_dump())


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
