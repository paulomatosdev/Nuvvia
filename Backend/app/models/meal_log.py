import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MealLogSource(str, enum.Enum):
    PHOTO_AI = "photo_ai"    # calculado a partir de foto via IA
    MANUAL = "manual"        # o paciente lançou manualmente


class MealLog(Base):
    """
    Registro de uma refeição consumida pelo paciente, usado para
    acompanhar a meta diária de macros. Alimentado principalmente
    pelo módulo de IA (foto -> macros).
    """
    __tablename__ = "meal_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)

    source: Mapped[MealLogSource] = mapped_column(Enum(MealLogSource), default=MealLogSource.PHOTO_AI)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Resultado do reconhecimento/estimativa (editável pelo paciente depois)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    calories: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    protein_g: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    carbs_g: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    fat_g: Mapped[float] = mapped_column(Float, nullable=False, default=0)

    # Confiança da estimativa da IA (0 a 1), útil para sinalizar no app
    # quando o paciente deveria revisar/corrigir manualmente
    ai_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)

    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
