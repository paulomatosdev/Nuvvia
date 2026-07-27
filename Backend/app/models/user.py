import enum
import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, Enum, Boolean, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    PATIENT = "patient"
    NUTRITIONIST = "nutritionist"
    ADMIN = "admin"


class User(Base):
    """
    Tabela única de usuários. O papel (role) define se é paciente,
    nutricionista ou admin. Dados específicos de cada perfil ficam
    em tabelas relacionadas (ex: PatientProfile, NutritionistProfile).
    """
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, default=UserRole.PATIENT)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    patient_profile: Mapped["PatientProfile"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    nutritionist_profile: Mapped["NutritionistProfile"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), unique=True
    )
    birth_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    height_cm: Mapped[float | None] = mapped_column(nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(nullable=True)
    goal: Mapped[str | None] = mapped_column(String(50), nullable=True)  # ex: emagrecimento, hipertrofia
    daily_calorie_target: Mapped[float | None] = mapped_column(nullable=True)
    daily_protein_target_g: Mapped[float | None] = mapped_column(nullable=True)
    daily_carbs_target_g: Mapped[float | None] = mapped_column(nullable=True)
    daily_fat_target_g: Mapped[float | None] = mapped_column(nullable=True)

    user: Mapped["User"] = relationship(back_populates="patient_profile")


class NutritionistProfile(Base):
    __tablename__ = "nutritionist_profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), unique=True
    )
    license_number: Mapped[str] = mapped_column(String(50), nullable=False)  # CRN
    bio: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    user: Mapped["User"] = relationship(back_populates="nutritionist_profile")
