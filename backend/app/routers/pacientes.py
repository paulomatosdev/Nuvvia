import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import garantir_acesso_paciente, require_role
from app.database import get_db
from app.models.consulta import Consulta, StatusConsulta
from app.models.dieta import RotinaAlimentar
from app.models.usuario import PerfilAcesso, Usuario
from app.schemas.paciente import PacientePainel
from app.services.resumo import adesao_da_semana, resumo_do_dia, semana_do_paciente

router = APIRouter(prefix="/pacientes", tags=["Pacientes (painel)"])

somente_equipe = require_role(PerfilAcesso.NUTRICIONISTA, PerfilAcesso.ADMIN)


async def _montar(db: AsyncSession, paciente: Usuario, nutricionista: Usuario) -> PacientePainel:
    agora = datetime.now(timezone.utc)
    filtros = [
        Consulta.paciente_id == paciente.id,
        Consulta.status != StatusConsulta.CANCELADO,
    ]
    if nutricionista.perfil_acesso == PerfilAcesso.NUTRICIONISTA:
        filtros.append(Consulta.nutricionista_id == nutricionista.id)

    ultima = await db.scalar(
        select(func.max(Consulta.agendamento_data)).where(*filtros, Consulta.agendamento_data < agora)
    )
    proxima = await db.scalar(
        select(func.min(Consulta.agendamento_data)).where(*filtros, Consulta.agendamento_data >= agora)
    )

    perfil = paciente.paciente_perfil
    semana = await semana_do_paciente(db, paciente)
    return PacientePainel(
        id=paciente.id,
        nome_completo=paciente.nome_completo,
        email=paciente.email,
        meta=perfil.meta if perfil else None,
        data_nascimento=perfil.data_nascimento if perfil else None,
        altura_cm=perfil.altura_cm if perfil else None,
        peso_kg=perfil.peso_kg if perfil else None,
        ultima_consulta=ultima,
        proxima_consulta=proxima,
        macros_hoje=await resumo_do_dia(db, paciente),
        adesao_7d=adesao_da_semana(semana),
        semana=semana,
    )


@router.get("", response_model=list[PacientePainel])
async def listar_pacientes(
    current_user: Usuario = Depends(somente_equipe),
    db: AsyncSession = Depends(get_db),
):
    """Nutricionista: pacientes com consulta ou rotina com ele. Admin: todos."""
    stmt = select(Usuario).where(
        Usuario.perfil_acesso == PerfilAcesso.PACIENTE, Usuario.ativo.is_(True)
    )
    if current_user.perfil_acesso == PerfilAcesso.NUTRICIONISTA:
        ids_consulta = select(Consulta.paciente_id).where(
            Consulta.nutricionista_id == current_user.id
        )
        ids_rotina = select(RotinaAlimentar.paciente_id).where(
            RotinaAlimentar.nutricionista_id == current_user.id
        )
        stmt = stmt.where(or_(Usuario.id.in_(ids_consulta), Usuario.id.in_(ids_rotina)))

    pacientes = (await db.scalars(stmt.order_by(Usuario.nome_completo))).all()
    return [await _montar(db, p, current_user) for p in pacientes]


@router.get("/me", response_model=PacientePainel)
async def meu_painel(
    current_user: Usuario = Depends(require_role(PerfilAcesso.PACIENTE)),
    db: AsyncSession = Depends(get_db),
):
    """Área do paciente: o próprio cartão (macros de hoje, semana, consultas)."""
    return await _montar(db, current_user, current_user)


@router.get("/{paciente_id}", response_model=PacientePainel)
async def detalhar_paciente(
    paciente_id: uuid.UUID,
    current_user: Usuario = Depends(somente_equipe),
    db: AsyncSession = Depends(get_db),
):
    await garantir_acesso_paciente(db, current_user, paciente_id)
    paciente = await db.get(Usuario, paciente_id)
    if paciente is None or paciente.perfil_acesso != PerfilAcesso.PACIENTE:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    return await _montar(db, paciente, current_user)
