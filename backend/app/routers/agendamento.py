import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_role
from app.database import get_db
from app.models.consulta import Consulta, StatusConsulta
from app.models.notificacao import Notificacao
from app.models.usuario import PacientePerfil, PerfilAcesso, Usuario
from app.schemas.agendamento import OpcaoLer, RespostaPresenca, ResultadoAgendamento, SolicitarConsulta
from app.schemas.consulta import UsuarioResumo
from app.services.agente_agendamento import Opcao, SemHorarioDisponivel, escolher, fuso, preferencias_do
from app.services.notificacoes import notificar, quando

router = APIRouter(prefix="/agendamento", tags=["Agendamento (agente)"])

somente_paciente = require_role(PerfilAcesso.PACIENTE)

SEM_HORARIO = (
    "Não encontramos horário livre nos próximos 14 dias com essas preferências. "
    "Tente aceitar outros períodos ou consulta online."
)


def _opcao_ler(o: Opcao) -> OpcaoLer:
    return OpcaoLer(
        nutricionista=UsuarioResumo.model_validate(o.nutricionista), inicio=o.inicio, tipo=o.tipo, local=o.local
    )


async def _marcar_lembretes_lidos(db: AsyncSession, consulta_id: uuid.UUID) -> None:
    await db.execute(
        update(Notificacao)
        .where(Notificacao.consulta_id == consulta_id, Notificacao.tipo == "lembrete_consulta")
        .values(lida=True)
    )


@router.post("/solicitar", response_model=ResultadoAgendamento, status_code=201)
async def solicitar_consulta(
    payload: SolicitarConsulta,
    current_user: Usuario = Depends(somente_paciente),
    db: AsyncSession = Depends(get_db),
):
    """O paciente pede uma consulta; o agente escolhe nutricionista, dia, horário e modalidade."""
    agora = datetime.now(timezone.utc)
    pendente = await db.scalar(
        select(Consulta).where(
            Consulta.paciente_id == current_user.id,
            Consulta.status.in_([StatusConsulta.AGENDADO, StatusConsulta.CONFIRMADO]),
            Consulta.agendamento_data > agora,
        )
    )
    if pendente:
        raise HTTPException(
            status_code=409,
            detail=f"Você já tem uma consulta marcada para {quando(pendente)}. Se precisar, use “Preciso remarcar”.",
        )

    # O que o paciente informou agora vira preferência salva para as próximas vezes
    perfil = current_user.paciente_perfil or PacientePerfil()
    current_user.paciente_perfil = perfil
    for campo, valor in (
        ("preferencia_tipo", payload.tipo),
        ("preferencia_periodos", payload.periodos),
        ("cidade", payload.cidade),
        ("bairro", payload.bairro),
    ):
        if valor is not None:
            setattr(perfil, campo, valor.strip() if isinstance(valor, str) else valor)

    try:
        melhor, alternativas = await escolher(db, current_user, preferencias_do(current_user), agora=agora)
    except SemHorarioDisponivel:
        await db.commit()
        raise HTTPException(status_code=404, detail=SEM_HORARIO)

    consulta = Consulta(
        paciente_id=current_user.id,
        nutricionista_id=melhor.nutricionista.id,
        tipo_consulta=melhor.tipo,
        status=StatusConsulta.AGENDADO,
        agendamento_data=melhor.inicio,
        duracao_minutos=melhor.nutricionista.nutricionista_perfil.duracao_consulta_min or 45,
        local=melhor.local,
        motivo_agente=melhor.explicacao()[:500],
    )
    db.add(consulta)
    await db.flush()
    notificar(
        db,
        melhor.nutricionista.id,
        "consulta_marcada",
        "Nova consulta marcada",
        f"{current_user.nome_completo} · {quando(consulta)} · "
        f"{'presencial' if melhor.local else 'online'}. Marcada pelo agente de agendamento.",
        consulta.id,
    )
    await db.commit()
    await db.refresh(consulta)
    return ResultadoAgendamento(
        consulta=consulta, explicacao=melhor.explicacao(), alternativas=[_opcao_ler(o) for o in alternativas]
    )


@router.post("/consultas/{consulta_id}/presenca", response_model=ResultadoAgendamento)
async def responder_presenca(
    consulta_id: uuid.UUID,
    payload: RespostaPresenca,
    current_user: Usuario = Depends(somente_paciente),
    db: AsyncSession = Depends(get_db),
):
    """Resposta ao lembrete da véspera: confirmar presença ou pedir para remarcar."""
    consulta = await db.get(Consulta, consulta_id)
    if not consulta or consulta.paciente_id != current_user.id:
        raise HTTPException(status_code=404, detail="Consulta não encontrada")
    agora = datetime.now(timezone.utc)
    inicio = consulta.agendamento_data if consulta.agendamento_data.tzinfo else consulta.agendamento_data.replace(tzinfo=timezone.utc)
    if consulta.status not in (StatusConsulta.AGENDADO, StatusConsulta.CONFIRMADO) or inicio <= agora:
        raise HTTPException(status_code=400, detail="Esta consulta não pode mais ser alterada")

    await _marcar_lembretes_lidos(db, consulta.id)

    if payload.acao == "confirmar":
        consulta.status = StatusConsulta.CONFIRMADO
        notificar(
            db,
            consulta.nutricionista_id,
            "consulta_confirmada",
            "Presença confirmada",
            f"{current_user.nome_completo} confirmou a consulta de {quando(consulta)}.",
            consulta.id,
        )
        await db.commit()
        await db.refresh(consulta)
        return ResultadoAgendamento(consulta=consulta, explicacao="Presença confirmada. Até lá!")

    # Remarcar: o agente procura outro horário com a mesma nutricionista
    anterior = quando(consulta)
    try:
        melhor, alternativas = await escolher(
            db,
            current_user,
            preferencias_do(current_user),
            agora=agora,
            somente_nutricionista=consulta.nutricionista_id,
            ignorar_consulta=consulta.id,
            evitar_inicio=inicio,
            evitar_dia=inicio.astimezone(fuso()).date(),
        )
    except SemHorarioDisponivel:
        await db.commit()
        raise HTTPException(status_code=404, detail=SEM_HORARIO)

    consulta.agendamento_data = melhor.inicio
    consulta.tipo_consulta = melhor.tipo
    consulta.local = melhor.local
    consulta.status = StatusConsulta.AGENDADO
    consulta.lembrete_enviado = False
    consulta.motivo_agente = melhor.explicacao()[:500]
    notificar(
        db,
        consulta.nutricionista_id,
        "consulta_remarcada",
        "Consulta remarcada",
        f"{current_user.nome_completo} pediu para remarcar. Saiu de {anterior} para {quando(consulta)}.",
        consulta.id,
    )
    await db.commit()
    await db.refresh(consulta)
    return ResultadoAgendamento(
        consulta=consulta, explicacao=melhor.explicacao(), alternativas=[_opcao_ler(o) for o in alternativas]
    )
