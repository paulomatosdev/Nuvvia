"""
Agente de agendamento: escolhe sozinho a melhor consulta para o paciente.

O paciente só pede a consulta. O agente:
1. Considera as nutricionistas possíveis: se o paciente já é acompanhado por
   uma (vínculo após a primeira consulta), só ela; senão, todas que têm
   disponibilidade cadastrada.
2. Gera os horários livres dos próximos 14 dias a partir da disponibilidade
   semanal de cada uma (no fuso da clínica), tirando os já ocupados e os que
   conflitam com outras consultas do próprio paciente.
3. Dá uma nota a cada opção (horário + modalidade):
   - localidade: presencial no mesmo bairro > mesma cidade; online quando o
     paciente prefere ou quando não há atendimento presencial perto;
   - disponibilidade: só entra nos períodos que o paciente aceita
     (manhã/tarde/noite) e, quanto mais cedo, melhor;
   - equilíbrio: entre nutricionistas equivalentes, a com agenda mais livre.
4. Marca a de maior nota e explica o motivo em uma frase.
"""
import unicodedata
import uuid
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.consulta import Consulta, StatusConsulta, TipoConsulta
from app.models.usuario import NutricionistaPerfil, PerfilAcesso, Usuario

JANELA_DIAS = 14
ANTECEDENCIA_MINIMA = timedelta(hours=2)
PERIODOS = {"manha": (6, 12), "tarde": (12, 18), "noite": (18, 24)}
NOME_PERIODO = {"manha": "manhã", "tarde": "tarde", "noite": "noite"}


def fuso() -> ZoneInfo:
    return ZoneInfo(get_settings().fuso_horario)


def _norm(s: str | None) -> str:
    if not s:
        return ""
    s = unicodedata.normalize("NFD", s.strip().lower())
    return "".join(c for c in s if unicodedata.category(c) != "Mn")


def periodo_de(hora: int) -> str:
    for nome, (ini, fim) in PERIODOS.items():
        if ini <= hora < fim:
            return nome
    return "noite"


class SemHorarioDisponivel(Exception):
    """Nenhuma nutricionista tem horário que atenda às preferências."""


@dataclass
class Preferencias:
    tipo: str = "tanto_faz"  # online | pessoal | tanto_faz
    periodos: list[str] = field(default_factory=list)  # vazio = qualquer período
    cidade: str | None = None
    bairro: str | None = None


@dataclass
class Opcao:
    nutricionista: Usuario
    inicio: datetime  # UTC
    tipo: TipoConsulta
    pontos: float
    motivos: list[str]

    @property
    def local(self) -> str | None:
        if self.tipo != TipoConsulta.PESSOAL:
            return None
        perfil = self.nutricionista.nutricionista_perfil
        partes = [perfil.endereco, perfil.bairro, perfil.cidade] if perfil else []
        return ", ".join(p for p in partes if p) or "Consultório"

    def explicacao(self) -> str:
        quando = self.inicio.astimezone(fuso())
        dias = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"]
        modalidade = "presencial" if self.tipo == TipoConsulta.PESSOAL else "online"
        base = (
            f"{self.nutricionista.nome_completo}, {dias[quando.weekday()]} {quando:%d/%m} às {quando:%H:%M}, "
            f"{modalidade}"
        )
        return f"{base}: {'; '.join(self.motivos)}." if self.motivos else f"{base}."


def preferencias_do(paciente: Usuario, tipo: str | None = None, periodos: list[str] | None = None) -> Preferencias:
    perfil = paciente.paciente_perfil
    return Preferencias(
        tipo=tipo or (perfil.preferencia_tipo if perfil else None) or "tanto_faz",
        periodos=periodos if periodos is not None else ((perfil.preferencia_periodos if perfil else None) or []),
        cidade=perfil.cidade if perfil else None,
        bairro=perfil.bairro if perfil else None,
    )


async def _nutricionistas_possiveis(db: AsyncSession, paciente: Usuario) -> list[Usuario]:
    perfil = paciente.paciente_perfil
    if perfil and perfil.nutricionista_id:
        nutri = await db.get(Usuario, perfil.nutricionista_id)
        return [nutri] if nutri and nutri.ativo else []
    stmt = select(Usuario).where(Usuario.perfil_acesso == PerfilAcesso.NUTRICIONISTA, Usuario.ativo.is_(True))
    return [
        u
        for u in (await db.scalars(stmt)).all()
        if u.nutricionista_perfil and u.nutricionista_perfil.disponibilidades
    ]


async def _ocupados(
    db: AsyncSession, usuario_ids: list[uuid.UUID], inicio: datetime, fim: datetime, ignorar: uuid.UUID | None
) -> dict[uuid.UUID, list[tuple[datetime, datetime]]]:
    """Intervalos ocupados por usuário (como nutricionista ou como paciente)."""
    stmt = select(Consulta).where(
        or_(Consulta.nutricionista_id.in_(usuario_ids), Consulta.paciente_id.in_(usuario_ids)),
        Consulta.status != StatusConsulta.CANCELADO,
        Consulta.agendamento_data >= inicio - timedelta(hours=4),
        Consulta.agendamento_data <= fim,
    )
    ocupados: dict[uuid.UUID, list[tuple[datetime, datetime]]] = {u: [] for u in usuario_ids}
    for c in (await db.scalars(stmt)).all():
        if c.id == ignorar:
            continue
        ini = c.agendamento_data if c.agendamento_data.tzinfo else c.agendamento_data.replace(tzinfo=timezone.utc)
        intervalo = (ini, ini + timedelta(minutes=c.duracao_minutos))
        for u in (c.nutricionista_id, c.paciente_id):
            if u in ocupados:
                ocupados[u].append(intervalo)
    return ocupados


def _conflita(ini: datetime, fim: datetime, intervalos: list[tuple[datetime, datetime]]) -> bool:
    return any(ini < b and a < fim for a, b in intervalos)


def _hhmm(s: str) -> time:
    h, m = s.split(":")
    return time(int(h), int(m))


def _pontuar_local(prefs: Preferencias, perfil: NutricionistaPerfil, tipo: TipoConsulta) -> tuple[float, str] | None:
    """Nota de localidade da modalidade, ou None se a modalidade não serve."""
    if tipo == TipoConsulta.PESSOAL:
        if not perfil.atende_presencial or prefs.tipo == "online":
            return None
        mesma_cidade = prefs.cidade and _norm(prefs.cidade) == _norm(perfil.cidade)
        if mesma_cidade and prefs.bairro and _norm(prefs.bairro) == _norm(perfil.bairro):
            return 40, f"presencial no seu bairro ({perfil.bairro})"
        if mesma_cidade:
            return 30, f"presencial na sua cidade ({perfil.cidade})"
        if not prefs.cidade:
            return 15, "presencial (informe sua cidade para opções mais perto)"
        if prefs.tipo == "pessoal":
            return 5, f"presencial em {perfil.cidade or 'outra cidade'}"
        return None  # longe e o paciente aceita online: melhor oferecer online
    if not perfil.atende_online or prefs.tipo == "pessoal":
        return None
    if prefs.tipo == "online":
        return 40, "online, como você prefere"
    return 20, "online, sem deslocamento"


async def gerar_opcoes(
    db: AsyncSession,
    paciente: Usuario,
    prefs: Preferencias,
    agora: datetime | None = None,
    somente_nutricionista: uuid.UUID | None = None,
    ignorar_consulta: uuid.UUID | None = None,
    evitar_inicio: datetime | None = None,
    evitar_dia: date | None = None,
) -> list[Opcao]:
    agora = agora or datetime.now(timezone.utc)
    tz = fuso()
    nutris = await _nutricionistas_possiveis(db, paciente)
    if somente_nutricionista:
        nutris = [n for n in nutris if n.id == somente_nutricionista] or [
            n for n in [await db.get(Usuario, somente_nutricionista)] if n and n.nutricionista_perfil
        ]
    if not nutris:
        return []

    fim_janela = agora + timedelta(days=JANELA_DIAS)
    ocupados = await _ocupados(db, [n.id for n in nutris] + [paciente.id], agora, fim_janela, ignorar_consulta)
    carga = {n.id: len(ocupados.get(n.id, [])) for n in nutris}

    opcoes: list[Opcao] = []
    hoje_local = agora.astimezone(tz).date()
    for nutri in nutris:
        perfil = nutri.nutricionista_perfil
        duracao = timedelta(minutes=perfil.duracao_consulta_min or 45)
        modalidades = [
            (tipo, r)
            for tipo in (TipoConsulta.PESSOAL, TipoConsulta.ONLINE)
            if (r := _pontuar_local(prefs, perfil, tipo)) is not None
        ]
        if not modalidades:
            continue
        for d in range(JANELA_DIAS + 1):
            dia: date = hoje_local + timedelta(days=d)
            if dia == evitar_dia:
                continue  # ao remarcar, a pessoa normalmente não pode naquele dia
            for disp in (x for x in perfil.disponibilidades if x.dia_semana == dia.weekday()):
                cursor = datetime.combine(dia, _hhmm(disp.hora_inicio), tz)
                limite = datetime.combine(dia, _hhmm(disp.hora_fim), tz)
                while cursor + duracao <= limite:
                    ini_utc = cursor.astimezone(timezone.utc)
                    fim_utc = ini_utc + duracao
                    periodo = periodo_de(cursor.hour)
                    livre = (
                        ini_utc >= agora + ANTECEDENCIA_MINIMA
                        and not _conflita(ini_utc, fim_utc, ocupados.get(nutri.id, []))
                        and not _conflita(ini_utc, fim_utc, ocupados.get(paciente.id, []))
                        and (evitar_inicio is None or ini_utc != evitar_inicio)
                        and (not prefs.periodos or periodo in prefs.periodos)
                    )
                    if livre:
                        for tipo, (pontos_local, motivo_local) in modalidades:
                            motivos = [motivo_local]
                            pontos = pontos_local
                            if prefs.periodos:
                                pontos += 15
                                motivos.append(f"no período da {NOME_PERIODO[periodo]}, que você escolheu")
                            dias_ate = (ini_utc - agora).total_seconds() / 86400
                            pontos += max(0.0, 30 - 2 * dias_ate)
                            if dias_ate < 3:
                                motivos.append("o horário livre mais próximo")
                            if paciente.paciente_perfil and paciente.paciente_perfil.nutricionista_id == nutri.id:
                                motivos.insert(0, "sua nutricionista de acompanhamento")
                            pontos -= 0.5 * carga[nutri.id]
                            opcoes.append(Opcao(nutri, ini_utc, tipo, round(pontos, 2), motivos))
                    cursor += duracao
    opcoes.sort(key=lambda o: (-o.pontos, o.inicio))
    return opcoes


def _distintas(opcoes: list[Opcao], n: int) -> list[Opcao]:
    """Alternativas com horários diferentes entre si."""
    vistas, saida = set(), []
    for o in opcoes:
        chave = (o.nutricionista.id, o.inicio)
        if chave not in vistas:
            vistas.add(chave)
            saida.append(o)
        if len(saida) == n:
            break
    return saida


async def escolher(
    db: AsyncSession, paciente: Usuario, prefs: Preferencias, **kwargs
) -> tuple[Opcao, list[Opcao]]:
    opcoes = await gerar_opcoes(db, paciente, prefs, **kwargs)
    if not opcoes:
        raise SemHorarioDisponivel()
    melhores = _distintas(opcoes, 4)
    return melhores[0], melhores[1:]
