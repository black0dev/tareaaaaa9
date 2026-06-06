import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_admin
from app.models import Category, Product, ProductImage, ProductVariant, Profile
from app.schemas.admin import (
    AdminImageOut,
    AdminProductCreate,
    AdminProductListItem,
    AdminProductOut,
    AdminProductUpdate,
    AdminVariantCreate,
    AdminVariantOut,
    AdminVariantUpdate,
)
from app.schemas.common import APIResponse

router = APIRouter(prefix="/admin", tags=["Admin Products"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "products")


def _ensure_upload_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)


def _product_to_out(p: Product) -> AdminProductListItem:
    active_variants = [v for v in p.variants if v.is_active]
    total_stock = sum(v.stock_quantity for v in active_variants)

    primary_img = None
    for img in sorted(p.images, key=lambda i: i.sort_order):
        if img.is_primary:
            primary_img = img
            break
    if primary_img is None and p.images:
        primary_img = sorted(p.images, key=lambda i: i.sort_order)[0]

    return AdminProductListItem(
        id=p.id,
        name=p.name,
        slug=p.slug,
        description=p.description,
        material=p.material,
        brand=p.brand,
        base_price=p.base_price,
        category_id=p.category_id,
        category_name=p.category.name if p.category else None,
        is_active=p.is_active,
        created_at=p.created_at,
        updated_at=p.updated_at,
        variants_count=len(active_variants),
        total_stock=total_stock,
        primary_image_url=primary_img.image_url if primary_img else None,
    )


# ---------------------------------------------------------------------------
# Product CRUD
# ---------------------------------------------------------------------------

@router.get("/products", response_model=APIResponse)
async def admin_list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    is_active: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
    admin: Profile = Depends(get_current_admin),
):
    where_clauses = []

    if search:
        where_clauses.append(Product.name.ilike(f"%{search}%"))
    if is_active is not None:
        where_clauses.append(Product.is_active == is_active)

    count_q = select(func.count(Product.id)).where(*where_clauses)
    total = (await db.execute(count_q)).scalar() or 0

    offset = (page - 1) * page_size
    products_q = (
        select(Product)
        .where(*where_clauses)
        .options(
            selectinload(Product.category),
            selectinload(Product.variants),
            selectinload(Product.images),
        )
        .offset(offset)
        .limit(page_size)
        .order_by(Product.created_at.desc())
    )
    result = await db.execute(products_q)
    products = result.unique().scalars().all()

    data = [_product_to_out(p) for p in products]

    return APIResponse.success(
        data=[item.model_dump() for item in data],
        meta={
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max((total + page_size - 1) // page_size, 1),
        },
    )


@router.post("/products", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_product(
    payload: AdminProductCreate,
    db: AsyncSession = Depends(get_db),
    admin: Profile = Depends(get_current_admin),
):
    existing_slug = await db.execute(
        select(Product).where(Product.slug == payload.slug)
    )
    if existing_slug.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un producto con el slug '{payload.slug}'.",
        )

    if payload.category_id:
        cat = await db.execute(
            select(Category).where(Category.id == payload.category_id)
        )
        if cat.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoría con id '{payload.category_id}' no encontrada.",
            )

    product = Product(
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
        category_id=payload.category_id,
        material=payload.material,
        brand=payload.brand,
        base_price=payload.base_price,
    )
    db.add(product)
    await db.flush()

    result = await db.execute(
        select(Product)
        .where(Product.id == product.id)
        .options(
            selectinload(Product.category),
            selectinload(Product.variants),
            selectinload(Product.images),
        )
    )
    product = result.unique().scalar_one()

    return APIResponse.success(data=_product_to_out(product).model_dump())


@router.put("/products/{product_id}", response_model=APIResponse)
async def admin_update_product(
    product_id: str,
    payload: AdminProductUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Profile = Depends(get_current_admin),
):
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id)
        .options(
            selectinload(Product.category),
            selectinload(Product.variants),
            selectinload(Product.images),
        )
    )
    product = result.unique().scalar_one_or_none()

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con id '{product_id}' no encontrado.",
        )

    if payload.slug is not None and payload.slug != product.slug:
        existing = await db.execute(
            select(Product).where(Product.slug == payload.slug, Product.id != product_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ya existe un producto con el slug '{payload.slug}'.",
            )

    if payload.category_id is not None:
        cat = await db.execute(
            select(Category).where(Category.id == payload.category_id)
        )
        if cat.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoría con id '{payload.category_id}' no encontrada.",
            )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    await db.flush()
    await db.refresh(product)

    return APIResponse.success(data=_product_to_out(product).model_dump())


@router.delete("/products/{product_id}", response_model=APIResponse)
async def admin_delete_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Profile = Depends(get_current_admin),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con id '{product_id}' no encontrado.",
        )

    product.is_active = False
    await db.flush()

    return APIResponse.success(
        data={"id": product_id, "is_active": False},
        meta={"message": "Producto desactivado correctamente."},
    )


# ---------------------------------------------------------------------------
# Variant CRUD
# ---------------------------------------------------------------------------

@router.post(
    "/products/{product_id}/variants",
    response_model=APIResponse,
    status_code=status.HTTP_201_CREATED,
)
async def admin_create_variant(
    product_id: str,
    payload: AdminVariantCreate,
    db: AsyncSession = Depends(get_db),
    admin: Profile = Depends(get_current_admin),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con id '{product_id}' no encontrado.",
        )

    existing_sku = await db.execute(
        select(ProductVariant).where(ProductVariant.sku == payload.sku)
    )
    if existing_sku.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe una variante con el SKU '{payload.sku}'.",
        )

    variant = ProductVariant(
        product_id=product_id,
        sku=payload.sku,
        size=payload.size,
        color=payload.color,
        price_amount=payload.price_amount,
        stock_quantity=payload.stock_quantity,
    )
    db.add(variant)
    await db.flush()
    await db.refresh(variant)

    out = AdminVariantOut(
        id=variant.id,
        product_id=variant.product_id,
        sku=variant.sku,
        size=variant.size,
        color=variant.color,
        price_amount=variant.price_amount,
        stock_quantity=variant.stock_quantity,
        is_active=variant.is_active,
        created_at=variant.created_at,
        updated_at=variant.updated_at,
    )

    return APIResponse.success(data=out.model_dump())


@router.put("/variants/{variant_id}", response_model=APIResponse)
async def admin_update_variant(
    variant_id: str,
    payload: AdminVariantUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Profile = Depends(get_current_admin),
):
    result = await db.execute(
        select(ProductVariant).where(ProductVariant.id == variant_id)
    )
    variant = result.scalar_one_or_none()

    if variant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Variante con id '{variant_id}' no encontrada.",
        )

    if payload.sku is not None and payload.sku != variant.sku:
        existing = await db.execute(
            select(ProductVariant).where(
                ProductVariant.sku == payload.sku, ProductVariant.id != variant_id
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ya existe una variante con el SKU '{payload.sku}'.",
            )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(variant, field, value)

    await db.flush()
    await db.refresh(variant)

    out = AdminVariantOut(
        id=variant.id,
        product_id=variant.product_id,
        sku=variant.sku,
        size=variant.size,
        color=variant.color,
        price_amount=variant.price_amount,
        stock_quantity=variant.stock_quantity,
        is_active=variant.is_active,
        created_at=variant.created_at,
        updated_at=variant.updated_at,
    )

    return APIResponse.success(data=out.model_dump())


@router.delete("/variants/{variant_id}", response_model=APIResponse)
async def admin_delete_variant(
    variant_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Profile = Depends(get_current_admin),
):
    result = await db.execute(
        select(ProductVariant).where(ProductVariant.id == variant_id)
    )
    variant = result.scalar_one_or_none()

    if variant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Variante con id '{variant_id}' no encontrada.",
        )

    variant.is_active = False
    await db.flush()

    return APIResponse.success(
        data={"id": variant_id, "is_active": False},
        meta={"message": "Variante desactivada correctamente."},
    )


# ---------------------------------------------------------------------------
# Image Management
# ---------------------------------------------------------------------------

@router.post(
    "/products/{product_id}/images",
    response_model=APIResponse,
    status_code=status.HTTP_201_CREATED,
)
async def admin_upload_image(
    product_id: str,
    file: UploadFile = File(...),
    alt_text: str | None = None,
    db: AsyncSession = Depends(get_db),
    admin: Profile = Depends(get_current_admin),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con id '{product_id}' no encontrado.",
        )

    _ensure_upload_dir()

    ext = os.path.splitext(file.filename or "image.jpg")[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    image_url = f"/static/uploads/products/{filename}"

    sort_order_result = await db.execute(
        select(func.coalesce(func.max(ProductImage.sort_order), 0))
        .where(ProductImage.product_id == product_id)
    )
    next_order = (sort_order_result.scalar() or 0) + 1

    is_first_image = True
    count_result = await db.execute(
        select(func.count(ProductImage.id)).where(ProductImage.product_id == product_id)
    )
    if (count_result.scalar() or 0) > 0:
        is_first_image = False

    image = ProductImage(
        product_id=product_id,
        url=image_url,
        alt_text=alt_text,
        sort_order=next_order,
        is_primary=is_first_image,
    )
    db.add(image)
    await db.flush()
    await db.refresh(image)

    out = AdminImageOut(
        id=image.id,
        product_id=image.product_id,
        url=image.image_url,
        alt_text=image.alt_text,
        sort_order=image.sort_order,
        is_primary=image.is_primary,
        created_at=image.created_at,
    )

    return APIResponse.success(data=out.model_dump())


@router.delete("/images/{image_id}", response_model=APIResponse)
async def admin_delete_image(
    image_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Profile = Depends(get_current_admin),
):
    result = await db.execute(select(ProductImage).where(ProductImage.id == image_id))
    image = result.scalar_one_or_none()

    if image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Imagen con id '{image_id}' no encontrada.",
        )

    await db.delete(image)
    await db.flush()

    return APIResponse.success(
        data={"id": image_id},
        meta={"message": "Imagen eliminada correctamente."},
    )


@router.put("/images/{image_id}/primary", response_model=APIResponse)
async def admin_set_image_primary(
    image_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Profile = Depends(get_current_admin),
):
    result = await db.execute(select(ProductImage).where(ProductImage.id == image_id))
    image = result.scalar_one_or_none()

    if image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Imagen con id '{image_id}' no encontrada.",
        )

    await db.execute(
        update(ProductImage)
        .where(ProductImage.product_id == image.product_id)
        .values(is_primary=False)
    )

    image.is_primary = True
    await db.flush()
    await db.refresh(image)

    out = AdminImageOut(
        id=image.id,
        product_id=image.product_id,
        url=image.image_url,
        alt_text=image.alt_text,
        sort_order=image.sort_order,
        is_primary=image.is_primary,
        created_at=image.created_at,
    )

    return APIResponse.success(data=out.model_dump())
