import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.usuario import PerfilAcesso
from app.schemas.tipos import DataHoraUTC


class UsuarioCriar(BaseModel):
    nome_completo: str = Field(min_length=2, max_length=150)
    email: EmailStr
    senha: str = Field(min_length=8, max_length=72)
    # Cadastro público só cria pacientes ou nutricionistas; admin é criado à parte
    perfil_acesso: PerfilAcesso = PerfilAcesso.PACIENTE


class UsuarioLer(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nome_completo: str
    email: EmailStr
    perfil_acesso: PerfilAcesso
    ativo: bool
    criacao_data: DataHoraUTC


class PacientePerfilAtualizar(BaseModel):
    data_nascimento: date | None = None
    altura_cm: float | None = Field(default=None, gt=0, lt=300)
    peso_kg: float | None = Field(default=None, gt=0, lt=700)
    meta: str | None = Field(default=None, max_length=50)
    meta_diaria_calorias: float | None = Field(default=None, ge=0)
    meta_diaria_proteina_g: float | None = Field(default=None, ge=0)
    meta_diaria_carboidratos_g: float | None = Field(default=None, ge=0)
    meta_diaria_gordura_g: float | None = Field(default=None, ge=0)


class PacientePerfilLer(PacientePerfilAtualizar):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    usuario_id: uuid.UUID


class NutricionistaPerfilAtualizar(BaseModel):
    crn: str | None = Field(default=None, max_length=50)
    bio: str | None = Field(default=None, max_length=1000)


class NutricionistaPerfilLer(NutricionistaPerfilAtualizar):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    usuario_id: uuid.UUID


class UsuarioMe(UsuarioLer):
    """Usuário logado, com o perfil profissional quando for nutricionista."""
    nutricionista_perfil: NutricionistaPerfilLer | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str
