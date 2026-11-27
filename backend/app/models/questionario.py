import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Questionario(Base):
    """
    Respostas do questionário alimentar que o paciente preenche ao se
    cadastrar (ou quando refaz). Fica guardado como histórico e é mostrado
    à nutricionista na ficha do paciente.
    """
    __tablename__ = "questionario_alimentar"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    paciente_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)
    respostas: Mapped[dict] = mapped_column(JSON, nullable=False)
    # "app" (gerou dieta pelo app) ou "nutricionista" (preferiu consulta)
    modo: Mapped[str] = mapped_column(String(20), nullable=False)
    # Preenchido no Python (com microssegundos) para ordenar respostas do mesmo segundo
    criacao_data: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now()
    )
