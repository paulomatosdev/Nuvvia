import uuid
from datetime import date

from pydantic import BaseModel

from app.schemas.registro_alimentar import ResumoMacrosDiario
from app.schemas.tipos import DataHoraUTC


class DiaAdesao(BaseModel):
    data: date
    calorias: float
    na_meta: bool | None  # None quando o paciente não tem meta calórica


class PacientePainel(BaseModel):
    """Visão do paciente no painel do nutricionista."""
    id: uuid.UUID
    nome_completo: str
    email: str
    meta: str | None
    data_nascimento: date | None
    altura_cm: float | None
    peso_kg: float | None
    ultima_consulta: DataHoraUTC | None
    proxima_consulta: DataHoraUTC | None
    macros_hoje: ResumoMacrosDiario
    adesao_7d: int | None  # % de dias na meta calórica; None se sem meta
    semana: list[DiaAdesao]  # últimos 7 dias completos, do mais antigo ao mais recente
