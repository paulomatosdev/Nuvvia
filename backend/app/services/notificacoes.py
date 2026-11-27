"""Criação de notificações e lembretes da véspera."""
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.consulta import Consulta, StatusConsulta
from app.models.notificacao import Notificacao
from app.services.agente_agendamento import fuso


def notificar(
    db: AsyncSession, usuario_id: uuid.UUID, tipo: str, titulo: str, mensagem: str, consulta_id: uuid.UUID | None = None
) -> Notificacao:
    n = Notificacao(usuario_id=usuario_id, tipo=tipo, titulo=titulo, mensagem=mensagem, consulta_id=consulta_id)
    db.add(n)
    return n


def quando(c: Consulta) -> str:
    ini = c.agendamento_data if c.agendamento_data.tzinfo else c.agendamento_data.replace(tzinfo=timezone.utc)
    local = ini.astimezone(fuso())
    dias = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"]
    return f"{dias[local.weekday()]}, {local:%d/%m} às {local:%H:%M}"


async def gerar_lembretes(db: AsyncSession, agora: datetime | None = None, paciente_id: uuid.UUID | None = None) -> int:
    """
    Envia ao paciente, na véspera (ou no mesmo dia, se a consulta foi marcada
    em cima da hora), o pedido para confirmar presença ou remarcar.
    Só para consultas ainda não confirmadas. Retorna quantos foram enviados.
    """
    agora = agora or datetime.now(timezone.utc)
    amanha_local = (agora.astimezone(fuso()) + timedelta(days=1)).date()
    stmt = select(Consulta).where(
        Consulta.status == StatusConsulta.AGENDADO,
        Consulta.lembrete_enviado.is_(False),
        Consulta.agendamento_data > agora,
        Consulta.agendamento_data <= agora + timedelta(days=2),
    )
    if paciente_id:
        stmt = stmt.where(Consulta.paciente_id == paciente_id)
    enviados = 0
    for c in (await db.scalars(stmt)).all():
        ini = c.agendamento_data if c.agendamento_data.tzinfo else c.agendamento_data.replace(tzinfo=timezone.utc)
        if ini.astimezone(fuso()).date() > amanha_local:
            continue  # ainda não é véspera
        c.lembrete_enviado = True
        modalidade = "online" if c.tipo_consulta.value == "online" else f"presencial ({c.local or 'consultório'})"
        notificar(
            db,
            c.paciente_id,
            "lembrete_consulta",
            "Sua consulta é amanhã" if ini.astimezone(fuso()).date() == amanha_local else "Sua consulta é hoje",
            f"Consulta com {c.nutricionista.nome_completo}, {quando(c)}, {modalidade}. Você vai comparecer?",
            c.id,
        )
        enviados += 1
    if enviados:
        await db.commit()
    return enviados
