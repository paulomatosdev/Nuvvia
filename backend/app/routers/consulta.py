import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, obter_usuario_com_perfil, require_role
from app.database import get_db
from app.models.consulta import Consulta, TipoConsulta
from app.models.usuario import PerfilAcesso, Usuario
from app.schemas.consulta import ConsultaCriar, ConsultaLer, ConsultaStatusAtualizar

router = APIRouter(prefix="/consultas", tags=["Consultas"])


@router.post("", response_model=ConsultaLer, status_code=201)
async def criar_consulta(
    payload: ConsultaCriar,
    current_user: Usuario = Depends(
        require_role(PerfilAcesso.PACIENTE, PerfilAcesso.NUTRICIONISTA)
    ),
    db: AsyncSession = Depends(get_db),
):
    if payload.tipo_consulta == TipoConsulta.PESSOAL and not payload.local:
        raise HTTPException(status_code=400, detail="Consulta presencial exige um local")

    if current_user.perfil_acesso == PerfilAcesso.PACIENTE:
        if payload.nutricionista_id is None:
            raise HTTPException(status_code=400, detail="Informe o nutricionista")
        paciente_id, nutricionista_id = current_user.id, payload.nutricionista_id
        await obter_usuario_com_perfil(db, nutricionista_id, PerfilAcesso.NUTRICIONISTA)
    else:
        if payload.paciente_id is None:
            raise HTTPException(status_code=400, detail="Informe o paciente")
        paciente_id, nutricionista_id = payload.paciente_id, current_user.id
        await obter_usuario_com_perfil(db, paciente_id, PerfilAcesso.PACIENTE)

    consulta = Consulta(
        paciente_id=paciente_id,
        nutricionista_id=nutricionista_id,
        tipo_consulta=payload.tipo_consulta,
        agendamento_data=payload.agendamento_data,
        duracao_minutos=payload.duracao_minutos,
        local=payload.local,
        notas=payload.notas,
        # video_chamada_url é gerado depois (ex: integração com serviço de
        # videochamada) ao confirmar a consulta
    )
    db.add(consulta)
    await db.commit()
    await db.refresh(consulta)
    return consulta


@router.get("/minhas", response_model=list[ConsultaLer])
async def listar_minhas_consultas(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.perfil_acesso == PerfilAcesso.PACIENTE:
        stmt = select(Consulta).where(Consulta.paciente_id == current_user.id)
    else:
        stmt = select(Consulta).where(Consulta.nutricionista_id == current_user.id)

    return (await db.scalars(stmt.order_by(Consulta.agendamento_data))).all()


@router.patch("/{consulta_id}/status", response_model=ConsultaLer)
async def atualizar_status_consulta(
    consulta_id: uuid.UUID,
    payload: ConsultaStatusAtualizar,
    current_user: Usuario = Depends(require_role(PerfilAcesso.NUTRICIONISTA)),
    db: AsyncSession = Depends(get_db),
):
    consulta = await db.get(Consulta, consulta_id)
    if not consulta or consulta.nutricionista_id != current_user.id:
        raise HTTPException(status_code=404, detail="Consulta não encontrada")

    consulta.status = payload.status
    await db.commit()
    await db.refresh(consulta)
    return consulta
