import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.consulta import TipoConsulta
from app.schemas.consulta import ConsultaLer, UsuarioResumo
from app.schemas.tipos import DataHoraUTC

Periodo = Literal["manha", "tarde", "noite"]


class SolicitarConsulta(BaseModel):
    """Pedido de consulta: tudo opcional; sem nada, o agente usa as preferências salvas."""
    tipo: Literal["online", "pessoal", "tanto_faz"] | None = None
    periodos: list[Periodo] | None = None
    cidade: str | None = Field(default=None, max_length=80)
    bairro: str | None = Field(default=None, max_length=80)


class OpcaoLer(BaseModel):
    nutricionista: UsuarioResumo
    inicio: DataHoraUTC
    tipo: TipoConsulta
    local: str | None


class ResultadoAgendamento(BaseModel):
    consulta: ConsultaLer
    explicacao: str
    alternativas: list[OpcaoLer] = []


class RespostaPresenca(BaseModel):
    acao: Literal["confirmar", "remarcar"]


class NotificacaoLer(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    tipo: str
    titulo: str
    mensagem: str
    consulta_id: uuid.UUID | None
    lida: bool
    criacao_data: DataHoraUTC


class CaixaNotificacoes(BaseModel):
    nao_lidas: int
    itens: list[NotificacaoLer]


class JanelaDisponibilidade(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    dia_semana: int = Field(ge=0, le=6)
    hora_inicio: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    hora_fim: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")

    @field_validator("hora_fim")
    @classmethod
    def fim_depois_do_inicio(cls, v: str, info):
        inicio = info.data.get("hora_inicio")
        if inicio and v <= inicio:
            raise ValueError("O horário de fim precisa ser depois do início")
        return v
