import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from backend.app.models.registro_alimentar import MealLogSource


class MealLogFromPhotoResult(BaseModel):
    """Resposta retornada após a IA processar a foto da refeição."""
    description: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    ai_confidence: float


class MealLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    source: MealLogSource
    photo_url: str | None
    description: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    ai_confidence: float | None
    logged_at: datetime


class MealLogManualCreate(BaseModel):
    """Caso o paciente prefira lançar manualmente em vez de usar a foto."""
    description: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


class DailyMacroSummary(BaseModel):
    """Resumo do dia comparado com a meta do paciente, usado no dashboard."""
    date: datetime
    calories_consumed: float
    protein_consumed_g: float
    carbs_consumed_g: float
    fat_consumed_g: float
    calorie_target: float | None
    protein_target_g: float | None
    carbs_target_g: float | None
    fat_target_g: float | None
