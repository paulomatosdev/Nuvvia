import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.consulta import StatusConsulta, TipoConsulta
from app.schemas.tipos import DataHoraUTC

class ConsultaCriar(BaseModel):
    # Quando quem agenda é o paciente, informa o nutricionista;
    # quando é o nutricionista, informa o paciente.
    nutricionista_id: uuid.UUID | None = None
    paciente_id: uuid.UUID | None = None
    tipo_consulta: TipoConsulta
    agendamento_data: DataHoraUTC
    duracao_minutos: int = Field(default=45, ge=10, le=240)
    local: str | None = Field(default=None, max_length=255)  # obrigatório se presencial
    notas: str | None = Field(default=None, max_length=2000)

class UsuarioResumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    nome_completo: str

class ConsultaLer(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    paciente_id: uuid.UUID
    nutricionista_id: uuid.UUID
    paciente: UsuarioResumo
    nutricionista: UsuarioResumo
    tipo_consulta: TipoConsulta
    status: StatusConsulta
    agendamento_data: DataHoraUTC
    duracao_minutos: int
    video_chamada_url: str | None
    local: str | None
    notas: str | None
    motivo_agente: str | None = None
    criacao_data: DataHoraUTC

class ConsultaStatusAtualizar(BaseModel):
    status: StatusConsulta
