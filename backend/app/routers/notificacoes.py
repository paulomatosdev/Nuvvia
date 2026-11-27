import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.notificacao import Notificacao
from app.models.usuario import PerfilAcesso, Usuario
from app.schemas.agendamento import CaixaNotificacoes
from app.services.notificacoes import gerar_lembretes

router = APIRouter(prefix="/notificacoes", tags=["Notificações"])


@router.get("", response_model=CaixaNotificacoes)
async def minhas_notificacoes(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Garante o lembrete da véspera mesmo se a tarefa periódica ainda não rodou
    if current_user.perfil_acesso == PerfilAcesso.PACIENTE:
        await gerar_lembretes(db, paciente_id=current_user.id)

    itens = (
        await db.scalars(
            select(Notificacao)
            .where(Notificacao.usuario_id == current_user.id)
            .order_by(Notificacao.criacao_data.desc())
            .limit(30)
        )
    ).all()
    nao_lidas = await db.scalar(
        select(func.count()).where(Notificacao.usuario_id == current_user.id, Notificacao.lida.is_(False))
    )
    return CaixaNotificacoes(nao_lidas=nao_lidas or 0, itens=itens)


@router.post("/{notificacao_id}/lida", status_code=204)
async def marcar_lida(
    notificacao_id: uuid.UUID,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    n = await db.get(Notificacao, notificacao_id)
    if not n or n.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    n.lida = True
    await db.commit()


@router.post("/marcar-todas", status_code=204)
async def marcar_todas(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Lembretes que pedem resposta continuam abertos até o paciente responder
    await db.execute(
        update(Notificacao)
        .where(
            Notificacao.usuario_id == current_user.id,
            Notificacao.lida.is_(False),
            Notificacao.tipo != "lembrete_consulta",
        )
        .values(lida=True)
    )
    await db.commit()
