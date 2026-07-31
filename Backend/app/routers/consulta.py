import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from backend.app.models.consulta import Consulta, TipoConsulta
from backend.app.models.usuario import Usuario, PerfilAcesso
from app.schemas.appointment import AppointmentCreate, AppointmentRead, AppointmentStatusUpdate

router = APIRouter(prefix="/appointments", tags=["Consultas"])


@router.post("", response_model=AppointmentRead, status_code=201)
async def create_appointment(
    payload: AppointmentCreate,
    current_user: Usuario = Depends(require_role(PerfilAcesso.PACIENTE)),
    db: AsyncSession = Depends(get_db),
):
    if payload.consulta_type == TipoConsulta.PESSOAL and not payload.local:
        raise HTTPException(status_code=400, detail="Consulta presencial exige um local")

    consulta = Consulta(
        paciente_id=current_user.id,
        nutricionista_id=payload.nutricionista_id,
        consulta_type=payload.consulta_type,
        scheduled_at=payload.scheduled_at,
        duration_minutes=payload.duration_minutes,
        location=payload.location,
        notes=payload.notes,
        # video_call_url é gerado depois, ex: via integração com serviço de videochamada,
        # ao confirmar a consulta
    )
    db.add(consulta)
    await db.commit()
    await db.refresh(consulta)
    return consulta


@router.get("/mine", response_model=list[AppointmentRead])
async def list_my_appointments(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role == PerfilAcesso.PACIENTE:
        stmt = select(Consulta).where(Consulta.paciente_id == current_user.id)
    else:
        stmt = select(Consulta).where(Consulta.nutricionista_id == current_user.id)

    result = await db.execute(stmt.order_by(Consulta.scheduled_at))
    return result.scalars().all()


@router.patch("/{appointment_id}/status", response_model=AppointmentRead)
async def update_appointment_status(
    appointment_id: uuid.UUID,
    payload: AppointmentStatusUpdate,
    current_user: Usuario = Depends(require_role(PerfilAcesso.NUTRICIONISTA)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Consulta).where(Consulta.id == appointment_id))
    consulta = result.scalar_one_or_none()

    if not consulta or consulta.nutricionista_id != current_user.id:
        raise HTTPException(status_code=404, detail="Consulta não encontrada")

    consulta.status = payload.status
    await db.commit()
    await db.refresh(consulta)
    return consulta
