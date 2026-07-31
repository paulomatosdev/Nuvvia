from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from Backend.app.models.usuario import User, UserRole
from app.schemas.user import UserRead, PatientProfileUpdate

router = APIRouter(prefix="/users", tags=["Usuários"])


@router.get("/me", response_model=UserRead)
async def read_own_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me/patient-profile")
async def update_patient_profile(
    payload: PatientProfileUpdate,
    current_user: User = Depends(require_role(UserRole.PATIENT)),
    db: AsyncSession = Depends(get_db),
):
    profile = current_user.patient_profile
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.add(profile)
    await db.commit()
    return {"detail": "Perfil atualizado com sucesso"}
