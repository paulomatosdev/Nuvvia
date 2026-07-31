import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TipoConsulta(str, enum.Enum):
    PESSOAL = "pessoal"
    ONLINE = "online"


class StatusConsulta(str, enum.Enum):
    AGENDADO = "agendado"
    CONFIRMADO = "confirmado"
    CANCELADO = "cancelado"
    COMPLETADO = "completado"
    NAO_COMPARECIMENTO = "nao_comparecimento"


class Consulta(Base):
    __tablename__ = "consulta"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    paciente_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    nutricionista_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"), nullable=False)

    tipo_consulta: Mapped[TipoConsulta] = mapped_column(Enum(TipoConsulta), nullable=False)
    status: Mapped[StatusConsulta] = mapped_column(
        Enum(StatusConsulta), default=StatusConsulta.AGENDADO
    )

    agendamento_data: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duracao_minutos: Mapped[int] = mapped_column(default=45)

    # Preenchido quando for consulta online (link da videochamada)
    video_chamada_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Endereço/local, preenchido quando for presencial
    local: Mapped[str | None] = mapped_column(String(255), nullable=True)

    notas: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    criacao_data: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
