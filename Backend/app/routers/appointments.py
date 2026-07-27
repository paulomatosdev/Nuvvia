import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.models.appointment import Appointment, AppointmentType
from app.models.user import User, UserRole
from app.schemas.appointment import AppointmentCreate, AppointmentRead, AppointmentStatusUpdate

router = APIRouter(prefix="/appointments", tags=["Consultas"])


@router.post("", response_model=AppointmentRead, status_code=201)
async def create_appointment(
    payload: AppointmentCreate,
    current_user: User = Depends(require_role(UserRole.PATIENT)),
    db: AsyncSession = Depends(get_db),
):
    if payload.appointment_type == AppointmentType.IN_PERSON and not payload.location:
        raise HTTPException(status_code=400, detail="Consulta presencial exige um local")

    appointment = Appointment(
        patient_id=current_user.id,
        nutritionist_id=payload.nutritionist_id,
        appointment_type=payload.appointment_type,
        scheduled_at=payload.scheduled_at,
        duration_minutes=payload.duration_minutes,
        location=payload.location,
        notes=payload.notes,
        # video_call_url é gerado depois, ex: via integração com serviço de videochamada,
        # ao confirmar a consulta
    )
    db.add(appointment)
    await db.commit()
    await db.refresh(appointment)
    return appointment


@router.get("/mine", response_model=list[AppointmentRead])
async def list_my_appointments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role == UserRole.PATIENT:
        stmt = select(Appointment).where(Appointment.patient_id == current_user.id)
    else:
        stmt = select(Appointment).where(Appointment.nutritionist_id == current_user.id)

    result = await db.execute(stmt.order_by(Appointment.scheduled_at))
    return result.scalars().all()


@router.patch("/{appointment_id}/status", response_model=AppointmentRead)
async def update_appointment_status(
    appointment_id: uuid.UUID,
    payload: AppointmentStatusUpdate,
    current_user: User = Depends(require_role(UserRole.NUTRITIONIST)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appointment = result.scalar_one_or_none()

    if not appointment or appointment.nutritionist_id != current_user.id:
        raise HTTPException(status_code=404, detail="Consulta não encontrada")

    appointment.status = payload.status
    await db.commit()
    await db.refresh(appointment)
    return appointment
