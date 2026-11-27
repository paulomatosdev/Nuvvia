from fastapi import APIRouter, Depends
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.models.consulta import Consulta
from app.models.dieta import RotinaAlimentar
from app.models.usuario import Disponibilidade, NutricionistaPerfil, PacientePerfil, PerfilAcesso, Usuario
from app.schemas.agendamento import JanelaDisponibilidade
from app.schemas.consulta import UsuarioResumo
from app.schemas.usuario import (
    NutricionistaPerfilAtualizar,
    NutricionistaPerfilLer,
    PacientePerfilAtualizar,
    PacientePerfilLer,
    UsuarioLer,
    UsuarioMe,
)

router = APIRouter(prefix="/usuarios", tags=["Usuários"])


@router.get("/me", response_model=UsuarioMe)
async def ler_meu_usuario(current_user: Usuario = Depends(get_current_user)):
    return current_user


@router.get("/me/paciente-perfil", response_model=PacientePerfilLer)
async def ler_meu_perfil_paciente(
    current_user: Usuario = Depends(require_role(PerfilAcesso.PACIENTE)),
    db: AsyncSession = Depends(get_db),
):
    if current_user.paciente_perfil is None:
        current_user.paciente_perfil = PacientePerfil()
        await db.commit()
        await db.refresh(current_user.paciente_perfil)
    return current_user.paciente_perfil


@router.put("/me/paciente-perfil", response_model=PacientePerfilLer)
async def atualizar_meu_perfil_paciente(
    payload: PacientePerfilAtualizar,
    current_user: Usuario = Depends(require_role(PerfilAcesso.PACIENTE)),
    db: AsyncSession = Depends(get_db),
):
    perfil = current_user.paciente_perfil or PacientePerfil()
    current_user.paciente_perfil = perfil
    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(perfil, campo, valor)
    await db.commit()
    await db.refresh(perfil)
    return perfil


@router.put("/me/nutricionista-perfil", response_model=NutricionistaPerfilLer)
async def atualizar_meu_perfil_nutricionista(
    payload: NutricionistaPerfilAtualizar,
    current_user: Usuario = Depends(require_role(PerfilAcesso.NUTRICIONISTA)),
    db: AsyncSession = Depends(get_db),
):
    perfil = current_user.nutricionista_perfil or NutricionistaPerfil()
    current_user.nutricionista_perfil = perfil
    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(perfil, campo, valor)
    await db.commit()
    await db.refresh(perfil)
    return perfil


@router.get("/nutricionistas", response_model=list[UsuarioLer])
async def listar_nutricionistas(
    _: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Usado pelo paciente para escolher com quem agendar."""
    stmt = (
        select(Usuario)
        .where(Usuario.perfil_acesso == PerfilAcesso.NUTRICIONISTA, Usuario.ativo.is_(True))
        .order_by(Usuario.nome_completo)
    )
    return (await db.scalars(stmt)).all()


@router.get("/meus-pacientes", response_model=list[UsuarioLer])
async def listar_meus_pacientes(
    current_user: Usuario = Depends(require_role(PerfilAcesso.NUTRICIONISTA)),
    db: AsyncSession = Depends(get_db),
):
    """Pacientes com quem o nutricionista tem consulta ou rotina alimentar."""
    ids_consulta = select(Consulta.paciente_id).where(Consulta.nutricionista_id == current_user.id)
    ids_rotina = select(RotinaAlimentar.paciente_id).where(
        RotinaAlimentar.nutricionista_id == current_user.id
    )
    stmt = (
        select(Usuario)
        .where(or_(Usuario.id.in_(ids_consulta), Usuario.id.in_(ids_rotina)))
        .order_by(Usuario.nome_completo)
    )
    return (await db.scalars(stmt)).all()


@router.get("/me/disponibilidade", response_model=list[JanelaDisponibilidade])
async def minha_disponibilidade(
    current_user: Usuario = Depends(require_role(PerfilAcesso.NUTRICIONISTA)),
):
    perfil = current_user.nutricionista_perfil
    janelas = perfil.disponibilidades if perfil else []
    return sorted(janelas, key=lambda j: (j.dia_semana, j.hora_inicio))


@router.put("/me/disponibilidade", response_model=list[JanelaDisponibilidade])
async def definir_disponibilidade(
    janelas: list[JanelaDisponibilidade],
    current_user: Usuario = Depends(require_role(PerfilAcesso.NUTRICIONISTA)),
    db: AsyncSession = Depends(get_db),
):
    """Substitui as janelas semanais de atendimento usadas pelo agente de agendamento."""
    perfil = current_user.nutricionista_perfil or NutricionistaPerfil()
    current_user.nutricionista_perfil = perfil
    perfil.disponibilidades = [
        Disponibilidade(dia_semana=j.dia_semana, hora_inicio=j.hora_inicio, hora_fim=j.hora_fim) for j in janelas
    ]
    await db.commit()
    await db.refresh(perfil, attribute_names=["disponibilidades"])
    return sorted(perfil.disponibilidades, key=lambda j: (j.dia_semana, j.hora_inicio))


@router.get("/me/nutricionista", response_model=UsuarioResumo | None)
async def minha_nutricionista(
    current_user: Usuario = Depends(require_role(PerfilAcesso.PACIENTE)),
    db: AsyncSession = Depends(get_db),
):
    """Nutricionista que acompanha o paciente (definida após a primeira consulta concluída)."""
    perfil = current_user.paciente_perfil
    if not perfil or not perfil.nutricionista_id:
        return None
    return await db.get(Usuario, perfil.nutricionista_id)
