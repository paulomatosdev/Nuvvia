import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DietGoal(str, enum.Enum):
    WEIGHT_LOSS = "weight_loss"
    MUSCLE_GAIN = "muscle_gain"
    MAINTENANCE = "maintenance"
    HEALTH_CONDITION = "health_condition"  # ex: diabetes, hipertensão


class DietPlan(Base):
    """Plano de dieta montado pelo nutricionista para um paciente."""
    __tablename__ = "diet_plans"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    nutritionist_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)

    title: Mapped[str] = mapped_column(String(150), nullable=False)
    goal: Mapped[DietGoal] = mapped_column(Enum(DietGoal), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True)

    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    meals: Mapped[list["PlannedMeal"]] = relationship(
        back_populates="diet_plan", cascade="all, delete-orphan"
    )


class PlannedMeal(Base):
    """Uma refeição planejada dentro de um plano de dieta (ex: café da manhã)."""
    __tablename__ = "planned_meals"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    diet_plan_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("diet_plans.id"), nullable=False)

    name: Mapped[str] = mapped_column(String(100), nullable=False)  # ex: "Café da manhã"
    time_of_day: Mapped[str] = mapped_column(String(20), nullable=False)  # ex: "07:30"
    description: Mapped[str] = mapped_column(String(1000), nullable=False)  # itens da refeição

    target_calories: Mapped[float | None] = mapped_column(nullable=True)
    target_protein_g: Mapped[float | None] = mapped_column(nullable=True)
    target_carbs_g: Mapped[float | None] = mapped_column(nullable=True)
    target_fat_g: Mapped[float | None] = mapped_column(nullable=True)

    diet_plan: Mapped["DietPlan"] = relationship(back_populates="meals")
