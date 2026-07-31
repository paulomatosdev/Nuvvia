import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict

from Backend.app.models.usuario import UserRole


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.PATIENT


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime


class PatientProfileUpdate(BaseModel):
    birth_date: datetime | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    goal: str | None = None
    daily_calorie_target: float | None = None
    daily_protein_target_g: float | None = None
    daily_carbs_target_g: float | None = None
    daily_fat_target_g: float | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
