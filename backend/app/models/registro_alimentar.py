import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class FonteRegistro(str, enum.Enum):
    FOTO_IA = "foto_ia"     # calculado a partir de foto via IA
    MANUAL = "manual"        # o paciente lançou manualmente


class RegistroAlimentar(Base):
    """
    Registro de uma refeição consumida pelo paciente, usado para
    acompanhar a meta diária de macros. Alimentado principalmente
    pelo módulo de IA (foto -> macros).
    """
    __tablename__ = "registro_alimentar"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    paciente_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)

    fonte: Mapped[FonteRegistro] = mapped_column(Enum(FonteRegistro), default=FonteRegistro.FOTO_IA)
    foto_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Resultado do reconhecimento/estimativa (editável pelo paciente depois)
    descricao: Mapped[str] = mapped_column(String(1000), nullable=False)
    calorias: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    proteina_g: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    carboidratos_g: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    gordura_g: Mapped[float] = mapped_column(Float, nullable=False, default=0)

    # Confiança da estimativa da IA (0 a 1), útil para sinalizar no app
    # quando o paciente deveria revisar/corrigir manualmente
    ai_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)

    registro_data: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
