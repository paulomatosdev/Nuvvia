import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.registro_alimentar import FonteRegistro
from app.schemas.tipos import DataHoraUTC

class EstimativaMacros(BaseModel):
    """Resultado retornado pela IA após analisar a foto da refeição."""
    descricao: str
    calorias: float
    proteina_g: float
    carboidratos_g: float
    gordura_g: float
    ai_confidence: float

class RegistroAlimentarLer(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    paciente_id: uuid.UUID
    fonte: FonteRegistro
    foto_url: str | None
    descricao: str
    calorias: float
    proteina_g: float
    carboidratos_g: float
    gordura_g: float
    ai_confidence: float | None
    registro_data: DataHoraUTC

class RegistroAlimentarManualCriar(BaseModel):
    """Caso o paciente prefira lançar manualmente em vez de usar a foto."""
    descricao: str = Field(max_length=1000)
    calorias: float = Field(ge=0)
    proteina_g: float = Field(ge=0)
    carboidratos_g: float = Field(ge=0)
    gordura_g: float = Field(ge=0)

class ResumoMacrosDiario(BaseModel):
    """Resumo do dia comparado com a meta do paciente, usado no dashboard."""
    data: DataHoraUTC
    calorias_consumidas: float
    proteina_consumida_g: float
    carboidratos_consumidos_g: float
    gordura_consumida_g: float
    meta_calorias: float | None
    meta_proteina_g: float | None
    meta_carboidratos_g: float | None
    meta_gordura_g: float | None
