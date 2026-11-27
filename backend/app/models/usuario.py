import enum
import uuid
from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, Enum, ForeignKey, String, func
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
        back_populates="usuario",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
        foreign_keys="PacientePerfil.usuario_id",
    )
    nutricionista_perfil: Mapped["NutricionistaPerfil | None"] = relationship(
        back_populates="usuario", uselist=False, cascade="all, delete-orphan", lazy="selectin"
    )


class PacientePerfil(Base):
    __tablename__ = "paciente_perfil"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"), unique=True)
    data_nascimento: Mapped[date | None] = mapped_column(Date, nullable=True)
    # Sexo biológico, usado só nas equações de gasto energético
    sexo: Mapped[str | None] = mapped_column(String(20), nullable=True)
    altura_cm: Mapped[float | None] = mapped_column(nullable=True)
    peso_kg: Mapped[float | None] = mapped_column(nullable=True)
    meta: Mapped[str | None] = mapped_column(String(50), nullable=True)  # ex: emagrecimento, hipertrofia
    meta_diaria_calorias: Mapped[float | None] = mapped_column(nullable=True)
    meta_diaria_proteina_g: Mapped[float | None] = mapped_column(nullable=True)
    meta_diaria_carboidratos_g: Mapped[float | None] = mapped_column(nullable=True)
    meta_diaria_gordura_g: Mapped[float | None] = mapped_column(nullable=True)

    # Preferências usadas pelo agente de agendamento
    cidade: Mapped[str | None] = mapped_column(String(80), nullable=True)
    bairro: Mapped[str | None] = mapped_column(String(80), nullable=True)
    preferencia_tipo: Mapped[str | None] = mapped_column(String(20), nullable=True)  # online | pessoal | tanto_faz
    preferencia_periodos: Mapped[list | None] = mapped_column(JSON, nullable=True)  # ["manha", "tarde", "noite"]

    # Nutricionista que acompanha o paciente (definida após a primeira consulta concluída)
    nutricionista_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True, index=True)

    usuario: Mapped["Usuario"] = relationship(back_populates="paciente_perfil", foreign_keys=[usuario_id])


class NutricionistaPerfil(Base):
    __tablename__ = "nutricionista_perfil"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"), unique=True)
    crn: Mapped[str | None] = mapped_column(String(50), nullable=True)  # registro no conselho
    bio: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Onde atende (usado pelo agente de agendamento)
    cidade: Mapped[str | None] = mapped_column(String(80), nullable=True)
    bairro: Mapped[str | None] = mapped_column(String(80), nullable=True)
    endereco: Mapped[str | None] = mapped_column(String(255), nullable=True)
    atende_online: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")
    atende_presencial: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")
    duracao_consulta_min: Mapped[int] = mapped_column(default=45, server_default="45")

    disponibilidades: Mapped[list["Disponibilidade"]] = relationship(
        back_populates="nutricionista_perfil", cascade="all, delete-orphan", lazy="selectin"
    )

    usuario: Mapped["Usuario"] = relationship(back_populates="nutricionista_perfil")


class Disponibilidade(Base):
    """Janela semanal em que a nutricionista atende (ex.: terça, 08:00–12:00)."""
    __tablename__ = "disponibilidade"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nutricionista_perfil_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("nutricionista_perfil.id"), index=True)
    dia_semana: Mapped[int] = mapped_column(nullable=False)  # 0 = segunda ... 6 = domingo
    hora_inicio: Mapped[str] = mapped_column(String(5), nullable=False)  # "08:00"
    hora_fim: Mapped[str] = mapped_column(String(5), nullable=False)  # "12:00"

    nutricionista_perfil: Mapped["NutricionistaPerfil"] = relationship(back_populates="disponibilidades")
