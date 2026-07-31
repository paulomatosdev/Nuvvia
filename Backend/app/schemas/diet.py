import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from backend.app.models.dieta import DietGoal


class PlannedMealCreate(BaseModel):
    name: str
    time_of_day: str
    description: str
    target_calories: float | None = None
    target_protein_g: float | None = None
    target_carbs_g: float | None = None
    target_fat_g: float | None = None


class PlannedMealRead(PlannedMealCreate):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID


class DietPlanCreate(BaseModel):
    patient_id: uuid.UUID
    title: str
    goal: DietGoal
    start_date: datetime
    end_date: datetime | None = None
    meals: list[PlannedMealCreate] = []


class DietPlanRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    nutritionist_id: uuid.UUID
    title: str
    goal: DietGoal
    is_active: bool
    start_date: datetime
    end_date: datetime | None
    created_at: datetime
    meals: list[PlannedMealRead] = []
