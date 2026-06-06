from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.exceptions import AppError
from app.models import Category, Product, ProductVariant, ProductImage
from app.schemas.catalog import (
    CategoryOut,
    ProductDetailOut,
    ProductImageOut,
    ProductListItemOut,
    ProductVariantOut,
)
from app.schemas.common import APIResponse

router = APIRouter(tags=["Catalog"])


def _build_variant_out(v: ProductVariant) -> ProductVariantOut:
    return ProductVariantOut(
        id=v.id,
        size=v.size,
        color=v.color,
        price_amount=v.price_amount,
        stock_quantity=v.stock_quantity,
        sku=v.sku,
        is_active=v.is_active,
    )


def _build_image_out(img: ProductImage) -> ProductImageOut:
    return ProductImageOut(
        id=img.id,
        image_url=img.image_url,
        alt_text=img.alt_text,
        is_primary=img.is_primary,
        sort_order=img.sort_order,
    )


@router.get("/products")
async def list_products(
    category_id: str | None = Query(None),
    category_slug: str | None = Query(None),
    search: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    where_clauses = [Product.is_active == True]

    if category_id:
        where_clauses.append(Product.category_id == category_id)

    if category_slug:
        sub = select(Category.id).where(
            Category.slug == category_slug, Category.is_active == True
        )
        where_clauses.append(Product.category_id.in_(sub))

    if search:
        where_clauses.append(Product.name.ilike(f"%{search}%"))

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
        active_variants = [v for v in p.variants if v.is_active]
        variants_out = [_build_variant_out(v) for v in active_variants]

        primary_img = next(
            (img for img in sorted(p.images, key=lambda i: i.sort_order) if img.is_primary),
            None,
        )
        if primary_img is None and p.images:
            primary_img = sorted(p.images, key=lambda i: i.sort_order)[0]

        data.append(
            ProductListItemOut(
                id=p.id,
                name=p.name,
                slug=p.slug,
                description=p.description,
                category_name=p.category.name if p.category else None,
                variants=variants_out,
                primary_image_url=primary_img.image_url if primary_img else None,
            )
        )

    return APIResponse.success(
        data=[item.model_dump() for item in data],
        meta={"total": total},
    )


@router.get("/products/{slug}")
async def get_product_detail(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    product_q = (
        select(Product)
        .where(Product.slug == slug, Product.is_active == True)
        .options(
            selectinload(Product.category),
            selectinload(Product.variants),
            selectinload(Product.images),
        )
    )
    result = await db.execute(product_q)
    product = result.unique().scalar_one_or_none()

    if product is None:
        raise AppError(
            status_code=404,
            code="product_not_found",
            message="Producto no encontrado.",
        )

    active_variants = [v for v in product.variants if v.is_active]
    variants_out = [_build_variant_out(v) for v in active_variants]

    sorted_images = sorted(product.images, key=lambda i: i.sort_order)
    images_out = [_build_image_out(img) for img in sorted_images]

    primary_img = next((img for img in sorted_images if img.is_primary), None)
    if primary_img is None and sorted_images:
        primary_img = sorted_images[0]

    detail = ProductDetailOut(
        id=product.id,
        name=product.name,
        slug=product.slug,
        description=product.description,
        material=product.material,
        brand=product.brand,
        category_name=product.category.name if product.category else None,
        variants=variants_out,
        images=images_out,
        primary_image_url=primary_img.image_url if primary_img else None,
    )

    return APIResponse.success(data=detail.model_dump())


@router.get("/categories")
async def list_categories(
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Category)
        .where(Category.is_active == True)
        .order_by(Category.name)
    )
    result = await db.execute(q)
    categories = result.scalars().all()

    data = [
        CategoryOut(
            id=c.id,
            name=c.name,
            slug=c.slug,
            description=c.description,
        )
        for c in categories
    ]

    return APIResponse.success(
        data=[item.model_dump() for item in data],
        meta={"total": len(data)},
    )
