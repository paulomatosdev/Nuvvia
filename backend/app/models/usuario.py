import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PerfilAcesso(str, enum.Enum):
    PACIENTE = "paciente"
    NUTRICIONISTA = "nutricionista"
    ADMIN = "admin"


class Usuario(Base):
    """
    Tabela única de usuários. O perfil de acesso define se é paciente,
    nutricionista ou admin. Dados específicos de cada perfil ficam em
    tabelas relacionadas (PacientePerfil, NutricionistaPerfil).
    """
    __tablename__ = "usuarios"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nome_completo: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    senha_hashed: Mapped[str] = mapped_column(String(255), nullable=False)
    perfil_acesso: Mapped[PerfilAcesso] = mapped_column(
        Enum(PerfilAcesso), nullable=False, default=PerfilAcesso.PACIENTE
    )
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    criacao_data: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # lazy="selectin": carrega o perfil junto com o usuário (lazy load
    # implícito não funciona com sessão assíncrona)
    paciente_perfil: Mapped["PacientePerfil | None"] = relationship(
        back_populates="usuario", uselist=False, cascade="all, delete-orphan", lazy="selectin"
    )
    nutricionista_perfil: Mapped["NutricionistaPerfil | None"] = relationship(
        back_populates="usuario", uselist=False, cascade="all, delete-orphan", lazy="selectin"
    )


class PacientePerfil(Base):
    __tablename__ = "paciente_perfil"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"), unique=True)
    data_nascimento: Mapped[date | None] = mapped_column(Date, nullable=True)
    altura_cm: Mapped[float | None] = mapped_column(nullable=True)
    peso_kg: Mapped[float | None] = mapped_column(nullable=True)
    meta: Mapped[str | None] = mapped_column(String(50), nullable=True)  # ex: emagrecimento, hipertrofia
    meta_diaria_calorias: Mapped[float | None] = mapped_column(nullable=True)
    meta_diaria_proteina_g: Mapped[float | None] = mapped_column(nullable=True)
    meta_diaria_carboidratos_g: Mapped[float | None] = mapped_column(nullable=True)
    meta_diaria_gordura_g: Mapped[float | None] = mapped_column(nullable=True)

    usuario: Mapped["Usuario"] = relationship(back_populates="paciente_perfil")


class NutricionistaPerfil(Base):
    __tablename__ = "nutricionista_perfil"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"), unique=True)
    crn: Mapped[str | None] = mapped_column(String(50), nullable=True)  # registro no conselho
    bio: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    usuario: Mapped["Usuario"] = relationship(back_populates="nutricionista_perfil")
