import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Notificacao(Base):
    """
    Aviso para um usuário. Tipos:
    - consulta_marcada: para a nutricionista, quando o agente marca uma consulta
    - consulta_confirmada / consulta_remarcada: para a nutricionista, resposta do paciente
    - lembrete_consulta: para o paciente, na véspera, pedindo confirmação (exige ação)
    - vinculo: para o paciente, quando passa a ser acompanhado por uma nutricionista
    """
    __tablename__ = "notificacoes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)
    tipo: Mapped[str] = mapped_column(String(40), nullable=False)
    titulo: Mapped[str] = mapped_column(String(150), nullable=False)
    mensagem: Mapped[str] = mapped_column(String(1000), nullable=False)
    consulta_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("consulta.id"), nullable=True)
    lida: Mapped[bool] = mapped_column(Boolean, default=False)
    criacao_data: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now()
    )
