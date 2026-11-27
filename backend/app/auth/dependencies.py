import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import exists, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.security import decode_access_token
from app.database import get_db
from app.models.consulta import Consulta
from app.models.dieta import RotinaAlimentar
from app.models.usuario import PacientePerfil, PerfilAcesso, Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None or "sub" not in payload:
        raise credentials_error

    try:
        user_id = uuid.UUID(payload["sub"])
    except ValueError:
        raise credentials_error

    usuario = await db.get(Usuario, user_id)
    if usuario is None or not usuario.ativo:
        raise credentials_error

    return usuario


def require_role(*allowed_roles: PerfilAcesso):
    """Fábrica de dependência: restringe uma rota a determinados perfis."""

    async def checker(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        if current_user.perfil_acesso not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para acessar este recurso",
            )
        return current_user

    return checker


async def nutricionista_atende_paciente(
    db: AsyncSession, nutricionista_id: uuid.UUID, paciente_id: uuid.UUID
) -> bool:
    """Há vínculo quando existe consulta, rotina alimentar ou acompanhamento entre os dois."""
    stmt = select(
        or_(
            exists().where(
                PacientePerfil.usuario_id == paciente_id,
                PacientePerfil.nutricionista_id == nutricionista_id,
            ),
            exists().where(
                Consulta.nutricionista_id == nutricionista_id,
                Consulta.paciente_id == paciente_id,
            ),
            exists().where(
                RotinaAlimentar.nutricionista_id == nutricionista_id,
                RotinaAlimentar.paciente_id == paciente_id,
            ),
        )
    )
    return bool(await db.scalar(stmt))


async def garantir_acesso_paciente(
    db: AsyncSession, current_user: Usuario, paciente_id: uuid.UUID
) -> None:
    """
    Paciente só acessa os próprios dados; nutricionista só acessa pacientes
    com quem tem vínculo; admin acessa tudo.
    """
    perfil = current_user.perfil_acesso
    if perfil == PerfilAcesso.ADMIN:
        return
    if perfil == PerfilAcesso.PACIENTE and current_user.id == paciente_id:
        return
    if perfil == PerfilAcesso.NUTRICIONISTA and await nutricionista_atende_paciente(
        db, current_user.id, paciente_id
    ):
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado")


async def obter_usuario_com_perfil(
    db: AsyncSession, usuario_id: uuid.UUID, perfil: PerfilAcesso
) -> Usuario:
    usuario = await db.get(Usuario, usuario_id)
    if usuario is None or not usuario.ativo or usuario.perfil_acesso != perfil:
        raise HTTPException(status_code=404, detail=f"{perfil.value.capitalize()} não encontrado")
    return usuario
