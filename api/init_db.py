"""
Inicializacion de la base de datos SQLite: crea tablas y datos semilla.
"""
import asyncio
from passlib.context import CryptContext

from app.database import engine, async_session
from app.models import Base
from app.models import Category, Product, ProductVariant, ProductImage, Profile, Role, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def init_db():
    # Crear todas las tablas
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # Verificar si ya hay datos
        from sqlalchemy import select, func
        result = await db.execute(select(func.count()).select_from(Product))
        if result.scalar() > 0:
            print("DB already initialized.")
            return

        # Roles
        admin_role = Role(id="10000000-0000-0000-0000-000000000001", code="admin", name="Administrador")
        customer_role = Role(id="10000000-0000-0000-0000-000000000002", code="customer", name="Cliente")
        db.add_all([admin_role, customer_role])

        # Admin profile
        hashed = pwd_context.hash("admin123")
        admin = Profile(
            id="20000000-0000-0000-0000-000000000001",
            auth_user_id="00000000-0000-0000-0000-000000000001",
            full_name="Administrador",
            email="admin@tienda.com",
            phone="+51999999999",
            hashed_password=hashed,
            is_active=True,
        )
        db.add(admin)

        # Assign admin role
        db.add(UserRole(
            id="21000000-0000-0000-0000-000000000001",
            profile_id=admin.id,
            role_id=admin_role.id,
        ))

        # Category
        cat = Category(
            id="30000000-0000-0000-0000-000000000001",
            name="Camisetas",
            slug="camisetas",
            description="Camisetas de algodón de alta calidad con diseños exclusivos",
            is_active=True,
            sort_order=1,
        )
        db.add(cat)

        # Product 1
        p1 = Product(
            id="40000000-0000-0000-0000-000000000001",
            category_id=cat.id,
            name="Camiseta Negra Básica",
            slug="camiseta-negra-basica",
            description="Camiseta 100% algodón peinado de color negro. Corte clásico, cuello redondo. Ideal para uso diario.",
            material="Algodón peinado",
            brand="Basic Wear",
            is_active=True,
        )
        db.add(p1)

        variants_p1 = [
            ProductVariant(id="50000000-0000-0000-0000-000000000001", product_id=p1.id, sku="CNB-S-NEG", size="S", color="Negro", price_amount=3990, stock_quantity=25, is_active=True),
            ProductVariant(id="50000000-0000-0000-0000-000000000002", product_id=p1.id, sku="CNB-M-NEG", size="M", color="Negro", price_amount=3990, stock_quantity=40, is_active=True),
            ProductVariant(id="50000000-0000-0000-0000-000000000003", product_id=p1.id, sku="CNB-L-NEG", size="L", color="Negro", price_amount=3990, stock_quantity=30, is_active=True),
            ProductVariant(id="50000000-0000-0000-0000-000000000004", product_id=p1.id, sku="CNB-XL-NEG", size="XL", color="Negro", price_amount=3990, stock_quantity=15, is_active=True),
        ]
        db.add_all(variants_p1)

        db.add(ProductImage(id="60000000-0000-0000-0000-000000000001", product_id=p1.id, image_url="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600", alt_text="Camiseta Negra Básica", is_primary=True, sort_order=0, is_active=True))
        db.add(ProductImage(id="60000000-0000-0000-0000-000000000002", product_id=p1.id, image_url="https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600", alt_text="Camiseta Negra - Detalle", is_primary=False, sort_order=1, is_active=True))

        # Product 2
        p2 = Product(
            id="40000000-0000-0000-0000-000000000002",
            category_id=cat.id,
            name="Camiseta Blanca con Logo",
            slug="camiseta-blanca-con-logo",
            description="Camiseta blanca 100% algodón con logo estampado al frente. Corte moderno y cómodo.",
            material="Algodón",
            brand="Urban Style",
            is_active=True,
        )
        db.add(p2)

        variants_p2 = [
            ProductVariant(id="50000000-0000-0000-0000-000000000005", product_id=p2.id, sku="CBL-S-BCO", size="S", color="Blanco", price_amount=4490, stock_quantity=20, is_active=True),
            ProductVariant(id="50000000-0000-0000-0000-000000000006", product_id=p2.id, sku="CBL-M-BCO", size="M", color="Blanco", price_amount=4490, stock_quantity=35, is_active=True),
            ProductVariant(id="50000000-0000-0000-0000-000000000007", product_id=p2.id, sku="CBL-L-BCO", size="L", color="Blanco", price_amount=4490, stock_quantity=25, is_active=True),
            ProductVariant(id="50000000-0000-0000-0000-000000000008", product_id=p2.id, sku="CBL-XL-BCO", size="XL", color="Blanco", price_amount=4490, stock_quantity=10, is_active=True),
        ]
        db.add_all(variants_p2)

        db.add(ProductImage(id="60000000-0000-0000-0000-000000000003", product_id=p2.id, image_url="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600", alt_text="Camiseta Blanca con Logo", is_primary=True, sort_order=0, is_active=True))

        await db.commit()
        print("DB initialized with seed data.")


if __name__ == "__main__":
    asyncio.run(init_db())
    print("Done.")
