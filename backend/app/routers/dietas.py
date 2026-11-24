import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import (
    garantir_acesso_paciente,
    get_current_user,
    obter_usuario_com_perfil,
    require_role,
)
from app.database import get_db
from app.models.dieta import PlanoAlimentar, RotinaAlimentar
from app.models.usuario import PerfilAcesso, Usuario
from app.schemas.dieta import RotinaAlimentarCriar, RotinaAlimentarLer

router = APIRouter(prefix="/dietas", tags=["Dietas"])


@router.post("", response_model=RotinaAlimentarLer, status_code=201)
async def criar_rotina_alimentar(
    payload: RotinaAlimentarCriar,
    current_user: Usuario = Depends(require_role(PerfilAcesso.NUTRICIONISTA)),
    db: AsyncSession = Depends(get_db),
):
    await obter_usuario_com_perfil(db, payload.paciente_id, PerfilAcesso.PACIENTE)

    rotina = RotinaAlimentar(
        paciente_id=payload.paciente_id,
        nutricionista_id=current_user.id,
        titulo=payload.titulo,
        objetivo=payload.objetivo,
        data_inicio=payload.data_inicio,
        data_termino=payload.data_termino,
        refeicoes=[PlanoAlimentar(**r.model_dump()) for r in payload.refeicoes],
    )
    db.add(rotina)
    await db.commit()
    await db.refresh(rotina, attribute_names=["refeicoes", "criacao_data"])
    return rotina


@router.get("/paciente/{paciente_id}", response_model=list[RotinaAlimentarLer])
async def listar_rotinas_do_paciente(
    paciente_id: uuid.UUID,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await garantir_acesso_paciente(db, current_user, paciente_id)

    stmt = (
        select(RotinaAlimentar)
        .where(RotinaAlimentar.paciente_id == paciente_id)
        .order_by(RotinaAlimentar.data_inicio.desc())
    )
    return (await db.scalars(stmt)).all()
