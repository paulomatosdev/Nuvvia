import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ExamCreate(BaseModel):
    patient_id: uuid.UUID
    title: str
    exam_date: datetime
    notes: str | None = None
    # file_url é preenchido pelo backend após o upload do arquivo


class ExamRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    uploaded_by_id: uuid.UUID
    title: str
    exam_date: datetime
    file_url: str
    notes: str | None
    created_at: datetime
