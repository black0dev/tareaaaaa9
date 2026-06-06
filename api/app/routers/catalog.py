from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Product
from app.schemas.common import APIResponse

router = APIRouter(tags=["Catalog"])


@router.get("/products")
async def list_products(
    category_id: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    where_clauses = [
        Product.is_active == True,
        Product.deleted_at.is_(None),
    ]
    if category_id:
        where_clauses.append(Product.category_id == category_id)

    count_q = select(func.count(Product.id)).where(*where_clauses)
    total = (await db.execute(count_q)).scalar() or 0

    products_q = (
        select(Product)
        .where(*where_clauses)
        .options(
            selectinload(Product.category),
            selectinload(Product.variants),
            selectinload(Product.images),
        )
        .offset(offset)
        .limit(limit)
        .order_by(Product.name)
    )
    result = await db.execute(products_q)
    products = result.unique().scalars().all()

    data = []
    for p in products:
        variants = [
            {
                "id": v.id,
                "size": v.size,
                "color": v.color,
                "price_amount": v.price_amount,
                "stock_quantity": v.stock_quantity,
                "sku": v.sku,
            }
            for v in p.variants
            if v.is_active and v.deleted_at is None
        ]

        primary_img = next(
            (img for img in p.images if img.is_primary and img.is_active),
            None,
        )

        data.append(
            {
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "description": p.description,
                "category_name": p.category.name if p.category else None,
                "variants": variants,
                "primary_image_url": primary_img.image_url if primary_img else None,
            }
        )

    return APIResponse.success(data=data, meta={"total": total})
