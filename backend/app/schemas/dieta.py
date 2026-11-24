import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.models.dieta import DietaMeta
from app.schemas.tipos import DataHoraUTC


class PlanoAlimentarCriar(BaseModel):
    nome: str = Field(max_length=100)
    horario: str = Field(max_length=20)
    descricao: str = Field(max_length=1000)
    meta_calorias: float | None = Field(default=None, ge=0)
    meta_proteina_g: float | None = Field(default=None, ge=0)
    meta_carboidratos_g: float | None = Field(default=None, ge=0)
    meta_gordura_g: float | None = Field(default=None, ge=0)


class PlanoAlimentarLer(PlanoAlimentarCriar):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID


class RotinaAlimentarCriar(BaseModel):
    paciente_id: uuid.UUID
    titulo: str = Field(max_length=150)
    objetivo: DietaMeta
    data_inicio: date
    data_termino: date | None = None
    refeicoes: list[PlanoAlimentarCriar] = []


class RotinaAlimentarLer(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    paciente_id: uuid.UUID
    nutricionista_id: uuid.UUID
    titulo: str
    objetivo: DietaMeta
    ativo: bool
    data_inicio: date
    data_termino: date | None
    criacao_data: DataHoraUTC
    refeicoes: list[PlanoAlimentarLer] = []
