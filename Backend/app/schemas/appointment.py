import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from Backend.app.models.consulta import AppointmentType, AppointmentStatus


class AppointmentCreate(BaseModel):
    nutritionist_id: uuid.UUID
    appointment_type: AppointmentType
    scheduled_at: datetime
    duration_minutes: int = 45
    location: str | None = None  # obrigatório apenas se presencial
    notes: str | None = None


class AppointmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    nutritionist_id: uuid.UUID
    appointment_type: AppointmentType
    status: AppointmentStatus
    scheduled_at: datetime
    duration_minutes: int
    video_call_url: str | None
    location: str | None
    notes: str | None
    created_at: datetime


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus
