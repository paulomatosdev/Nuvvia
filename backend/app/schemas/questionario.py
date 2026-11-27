import uuid
from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.dieta import DietaMeta
from app.schemas.dieta import RotinaAlimentarLer
from app.schemas.tipos import DataHoraUTC

NivelAtividade = Literal["sedentario", "leve", "moderado", "alto", "muito_alto"]
Restricao = Literal["vegetariano", "vegano", "sem_lactose", "sem_gluten"]
CondicaoSaude = Literal["diabetes", "hipertensao", "doenca_renal", "gestante_lactante", "outra"]


class RespostasQuestionario(BaseModel):
    """Respostas do questionário alimentar do paciente."""

    sexo: Literal["feminino", "masculino"]
    data_nascimento: date
    altura_cm: float = Field(ge=100, le=250)
    peso_kg: float = Field(ge=30, le=300)
    nivel_atividade: NivelAtividade
    objetivo: DietaMeta
    refeicoes_por_dia: int = Field(ge=3, le=6)
    tempo_cozinhar: Literal["pouco", "medio", "bastante"]
    restricoes: list[Restricao] = []
    alergias: str | None = Field(default=None, max_length=500)
    condicoes_saude: list[CondicaoSaude] = []
    alimentos_preferidos: list[str] = []
    alimentos_evitados: list[str] = []
    # "app": montar a dieta agora; "nutricionista": prefere consulta
    modo: Literal["app", "nutricionista"]

    @field_validator("data_nascimento")
    @classmethod
    def nascimento_no_passado(cls, v: date) -> date:
        if v >= date.today():
            raise ValueError("Data de nascimento inválida")
        return v


class QuestionarioLer(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    paciente_id: uuid.UUID
    respostas: dict
    modo: str
    criacao_data: DataHoraUTC


class AlimentoOpcao(BaseModel):
    id: str
    nome: str
    grupo: str
    etiquetas: list[str]


class Referencia(BaseModel):
    titulo: str
    url: str


class Metas(BaseModel):
    calorias: float
    proteina_g: float
    carboidratos_g: float
    gordura_g: float


class ResultadoQuestionario(BaseModel):
    modo: Literal["app", "nutricionista"]
    # Quando o app não monta a dieta por segurança, explica o motivo
    recomendacao_consulta: bool
    motivo: str | None = None
    metas: Metas | None = None
    calculos: dict | None = None
    dieta: RotinaAlimentarLer | None = None
    referencias: list[Referencia] = []
