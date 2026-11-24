"""Cálculos de acompanhamento do paciente: macros do dia e adesão à meta."""
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.registro_alimentar import RegistroAlimentar
from app.models.usuario import Usuario
from app.schemas.paciente import DiaAdesao
from app.schemas.registro_alimentar import ResumoMacrosDiario

# Um dia conta como "dentro da meta" se as calorias ficaram a ±10% do alvo
TOLERANCIA_META = 0.10
DIAS_ADESAO = 7


def inicio_do_dia(referencia: datetime | None = None) -> datetime:
    # TODO: usar o fuso horário do paciente; hoje o "dia" é contado em UTC
    ref = referencia or datetime.now(timezone.utc)
    return ref.replace(hour=0, minute=0, second=0, microsecond=0)


async def resumo_do_dia(db: AsyncSession, paciente: Usuario) -> ResumoMacrosDiario:
    inicio = inicio_do_dia()
    stmt = select(
        func.coalesce(func.sum(RegistroAlimentar.calorias), 0),
        func.coalesce(func.sum(RegistroAlimentar.proteina_g), 0),
        func.coalesce(func.sum(RegistroAlimentar.carboidratos_g), 0),
        func.coalesce(func.sum(RegistroAlimentar.gordura_g), 0),
    ).where(
        RegistroAlimentar.paciente_id == paciente.id,
        RegistroAlimentar.registro_data >= inicio,
    )
    calorias, proteina, carboidratos, gordura = (await db.execute(stmt)).one()

    perfil = paciente.paciente_perfil
    return ResumoMacrosDiario(
        data=inicio,
        calorias_consumidas=calorias,
        proteina_consumida_g=proteina,
        carboidratos_consumidos_g=carboidratos,
        gordura_consumida_g=gordura,
        meta_calorias=perfil.meta_diaria_calorias if perfil else None,
        meta_proteina_g=perfil.meta_diaria_proteina_g if perfil else None,
        meta_carboidratos_g=perfil.meta_diaria_carboidratos_g if perfil else None,
        meta_gordura_g=perfil.meta_diaria_gordura_g if perfil else None,
    )


async def semana_do_paciente(db: AsyncSession, paciente: Usuario) -> list[DiaAdesao]:
    """
    Calorias de cada um dos últimos 7 dias completos (sem contar hoje), do
    mais antigo ao mais recente, com indicação de dia dentro da meta.
    """
    perfil = paciente.paciente_perfil
    meta = perfil.meta_diaria_calorias if perfil else None

    fim = inicio_do_dia()
    inicio = fim - timedelta(days=DIAS_ADESAO)
    stmt = select(RegistroAlimentar.registro_data, RegistroAlimentar.calorias).where(
        RegistroAlimentar.paciente_id == paciente.id,
        RegistroAlimentar.registro_data >= inicio,
        RegistroAlimentar.registro_data < fim,
    )
    por_dia: dict = defaultdict(float)
    for data, calorias in (await db.execute(stmt)).all():
        por_dia[data.date()] += calorias

    dias = []
    for n in range(DIAS_ADESAO, 0, -1):
        dia = (fim - timedelta(days=n)).date()
        total = por_dia.get(dia, 0.0)
        na_meta = abs(total - meta) <= meta * TOLERANCIA_META if meta else None
        dias.append(DiaAdesao(data=dia, calorias=total, na_meta=na_meta))
    return dias


def adesao_da_semana(semana: list[DiaAdesao]) -> int | None:
    """Percentual de dias dentro da meta calórica. None se não houver meta."""
    if not semana or semana[0].na_meta is None:
        return None
    return round(100 * sum(1 for d in semana if d.na_meta) / len(semana))
