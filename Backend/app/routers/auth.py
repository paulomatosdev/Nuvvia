from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.security import create_access_token, hash_password, verify_password
from app.database import get_db
from Backend.app.models.usuario import User, PatientProfile, NutritionistProfile, UserRole
from app.schemas.user import UserCreate, UserRead, Token, LoginRequest

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    await db.flush()  # garante user.id antes de criar o perfil

    if payload.role == UserRole.PATIENT:
        db.add(PatientProfile(user_id=user.id))
    elif payload.role == UserRole.NUTRITIONIST:
        # license_number precisa ser preenchido depois via endpoint de perfil
        db.add(NutritionistProfile(user_id=user.id, license_number=""))

    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")

    token = create_access_token(subject=str(user.id))
    return Token(access_token=token)
