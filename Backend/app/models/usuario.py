import enum
import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, Enum, Boolean, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PerfilAcesso(str, enum.Enum):
    PACIENTE = "paciente"
    NUTRICIONISTA = "nutricionista"
    ADMIN = "admin"


class Usuario(Base):
    """
    Tabela única de usuários. O papel (role) define se é paciente,
    nutricionista ou admin. Dados específicos de cada perfil ficam
    em tabelas relacionadas (ex: PatientProfile, NutritionistProfile).
    """
    __tablename__ = "usuarios"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nome_completo: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    senha_hashed: Mapped[str] = mapped_column(String(255), nullable=False)
    perfil_acesso: Mapped[PerfilAcesso] = mapped_column(Enum(PerfilAcesso), nullable=False, default=PerfilAcesso.PACIENTE)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    criacao_data: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    paciente_perfil: Mapped["PacientePerfil"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    nutricionista_perfil: Mapped["NutricionistaPerfil"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class PacientePerfil(Base):
    __tablename__ = "paciente_perfil"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("usuarios.id"), unique=True
    )
    data_nascimento: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    altura_cm: Mapped[float | None] = mapped_column(nullable=True)
    peso_kg: Mapped[float | None] = mapped_column(nullable=True)
    meta: Mapped[str | None] = mapped_column(String(50), nullable=True)  # ex: emagrecimento, hipertrofia
    meta_diaria_calorias: Mapped[float | None] = mapped_column(nullable=True)
    meta_diaria_proteina_g: Mapped[float | None] = mapped_column(nullable=True)
    meta_diaria_carbs_g: Mapped[float | None] = mapped_column(nullable=True)
    meta_diaria_fat_g: Mapped[float | None] = mapped_column(nullable=True)

    user: Mapped["Usuario"] = relationship(back_populates="paciente_perfil")


class NutricionistaPerfil(Base):
    __tablename__ = "nutricionista_perfil"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("usuarios.id"), unique=True
    )
    license_number: Mapped[str] = mapped_column(String(50), nullable=False)  # CRN
    bio: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    user: Mapped["Usuario"] = relationship(back_populates="nutricionista_perfil")
