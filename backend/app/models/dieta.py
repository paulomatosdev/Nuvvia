import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DietaMeta(str, enum.Enum):
    PERDER_PESO = "perder_peso"
    GANHO_MUSCULAR = "ganho_muscular"
    MANUTENCAO = "manutencao"
    CONDICAO_SAUDE = "condicao_saude"


class RotinaAlimentar(Base):
    """Plano de dieta montado pelo nutricionista para um paciente."""
    __tablename__ = "rotina_alimentar"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    paciente_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)
    nutricionista_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"), nullable=False)

    titulo: Mapped[str] = mapped_column(String(150), nullable=False)
    objetivo: Mapped[DietaMeta] = mapped_column(Enum(DietaMeta), nullable=False)
    ativo: Mapped[bool] = mapped_column(default=True)
    data_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    data_termino: Mapped[date | None] = mapped_column(Date, nullable=True)
    criacao_data: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    refeicoes: Mapped[list["PlanoAlimentar"]] = relationship(
        back_populates="rotina_alimentar", cascade="all, delete-orphan", lazy="selectin"
    )


class PlanoAlimentar(Base):
    """Uma refeição planejada dentro de uma rotina alimentar (ex: café da manhã)."""
    __tablename__ = "plano_alimentar"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    rotina_alimentar_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("rotina_alimentar.id"), nullable=False
    )

    nome: Mapped[str] = mapped_column(String(100), nullable=False)  # ex: "Café da manhã"
    horario: Mapped[str] = mapped_column(String(20), nullable=False)  # ex: "07:30"
    descricao: Mapped[str] = mapped_column(String(1000), nullable=False)  # itens da refeição

    meta_calorias: Mapped[float | None] = mapped_column(nullable=True)
    meta_proteina_g: Mapped[float | None] = mapped_column(nullable=True)
    meta_carboidratos_g: Mapped[float | None] = mapped_column(nullable=True)
    meta_gordura_g: Mapped[float | None] = mapped_column(nullable=True)

    rotina_alimentar: Mapped["RotinaAlimentar"] = relationship(back_populates="refeicoes")
