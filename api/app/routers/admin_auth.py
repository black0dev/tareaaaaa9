from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.config import settings
from app.database import get_db
from app.models import Profile, UserRole, Role
from app.schemas.common import APIResponse

router = APIRouter(prefix="/admin/auth", tags=["Admin Auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/login", response_model=APIResponse)
async def admin_login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Profile)
        .options(joinedload(Profile.roles).joinedload(UserRole.role))
        .where(Profile.email == payload.email, Profile.is_active == True)
    )
    profile = result.unique().scalar_one_or_none()

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales invalidas",
        )

    if not pwd_context.verify(payload.password, profile.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales invalidas",
        )

    is_admin = any(
        getattr(ur.role, "code", None) == "admin" for ur in profile.roles
    )
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales invalidas",
        )

    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {
        "sub": profile.id,
        "email": profile.email,
        "exp": expire,
    }
    access_token = jwt.encode(token_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    user_data = {
        "id": str(profile.id),
        "email": profile.email,
        "full_name": profile.full_name,
    }

    return APIResponse.success(data={
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data,
    })
