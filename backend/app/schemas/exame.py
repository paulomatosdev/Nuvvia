import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict
from app.schemas.tipos import DataHoraUTC


class ExameLer(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    paciente_id: uuid.UUID
    enviado_por_id: uuid.UUID
    titulo: str
    data_exame: date
    arquivo_url: str
    notas: str | None
    criacao_data: DataHoraUTC
