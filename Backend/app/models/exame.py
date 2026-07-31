import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Exame(Base):
    """Exame laboratorial ou clínico anexado ao histórico do paciente."""
    __tablename__ = "exames"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    paciente_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    enviado_por_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"), nullable=False)

    titulo: Mapped[str] = mapped_column(String(150), nullable=False)  # ex: "Hemograma completo"
    data_exame: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    arquivo_url: Mapped[str] = mapped_column(String(500), nullable=False)  # PDF/imagem armazenado
    notas: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    criacao_data: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
