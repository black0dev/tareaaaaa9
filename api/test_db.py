import asyncio
import sys
sys.path.insert(0, ".")
from app.database import async_session
from sqlalchemy import select, func
from app.models import Product, Profile, Role, UserRole

async def test():
    async with async_session() as db:
        # Test products
        r = await db.execute(select(func.count()).select_from(Product))
        print(f"Productos: {r.scalar()}")
        
        # Test admin
        r = await db.execute(select(Profile).where(Profile.email == "admin@tienda.com"))
        admin = r.scalar()
        print(f"Admin: {admin.email if admin else 'NO EXISTE'}")
        
        # Test roles
        r = await db.execute(select(Role))
        roles = r.scalars().all()
        for role in roles:
            print(f"Rol: {role.code} = {role.name}")
        
        # Test login
        from passlib.context import CryptContext
        pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
        if admin:
            ok = pwd.verify("admin123", admin.hashed_password)
            print(f"Password OK: {ok}")

asyncio.run(test())
