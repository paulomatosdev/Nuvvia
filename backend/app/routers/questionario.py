from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_role
from app.database import get_db
from app.models.dieta import PlanoAlimentar, RotinaAlimentar
from app.models.questionario import Questionario
from app.models.usuario import PacientePerfil, PerfilAcesso, Usuario
from app.schemas.questionario import (
    AlimentoOpcao,
    QuestionarioLer,
    RespostasQuestionario,
    ResultadoQuestionario,
)
from app.services.alimentos import ALIMENTOS, POR_ID
from app.services.dieta_gerador import (
    OBJETIVO_TEXTO,
    REFERENCIAS,
    calcular_metas,
    montar_semana,
    motivo_para_consulta,
    texto_explicacao,
)

router = APIRouter(prefix="/questionario", tags=["Questionário alimentar"])

somente_paciente = require_role(PerfilAcesso.PACIENTE)


@router.get("/alimentos", response_model=list[AlimentoOpcao])
async def listar_alimentos():
    """Alimentos que o paciente pode marcar como preferidos ou evitados."""
    return [
        AlimentoOpcao(id=a.id, nome=a.nome, grupo=a.grupo, etiquetas=sorted(a.etiquetas))
        for a in ALIMENTOS
        if a.refeicoes  # só os que o gerador de dieta usa
    ]


@router.get("/ultimo", response_model=QuestionarioLer | None)
async def ultimo_questionario(
    current_user: Usuario = Depends(somente_paciente),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Questionario)
        .where(Questionario.paciente_id == current_user.id)
        .order_by(Questionario.criacao_data.desc())
        .limit(1)
    )
    return await db.scalar(stmt)


@router.post("", response_model=ResultadoQuestionario)
async def responder_questionario(
    respostas: RespostasQuestionario,
    current_user: Usuario = Depends(somente_paciente),
    db: AsyncSession = Depends(get_db),
):
    desconhecidos = [i for i in respostas.alimentos_preferidos + respostas.alimentos_evitados if i not in POR_ID]
    if desconhecidos:
        raise HTTPException(status_code=422, detail=f"Alimentos desconhecidos: {', '.join(desconhecidos)}")

    # Dados do perfil sempre são atualizados, mesmo quando a dieta fica com a nutricionista
    perfil = current_user.paciente_perfil or PacientePerfil()
    current_user.paciente_perfil = perfil
    perfil.sexo = respostas.sexo
    perfil.data_nascimento = respostas.data_nascimento
    perfil.altura_cm = respostas.altura_cm
    perfil.peso_kg = respostas.peso_kg
    perfil.meta = OBJETIVO_TEXTO[respostas.objetivo]

    db.add(
        Questionario(
            paciente_id=current_user.id,
            respostas=respostas.model_dump(mode="json"),
            modo=respostas.modo,
        )
    )

    motivo = motivo_para_consulta(respostas)
    if respostas.modo == "nutricionista" or motivo:
        await db.commit()
        return ResultadoQuestionario(
            modo=respostas.modo,
            recomendacao_consulta=True,
            motivo=motivo,
            referencias=[],
        )

    calculo = calcular_metas(respostas)
    semana = montar_semana(respostas, calculo.metas)

    perfil.meta_diaria_calorias = calculo.metas.calorias
    perfil.meta_diaria_proteina_g = calculo.metas.proteina_g
    perfil.meta_diaria_carboidratos_g = calculo.metas.carboidratos_g
    perfil.meta_diaria_gordura_g = calculo.metas.gordura_g

    # A dieta nova do app substitui a anterior do app; dietas de nutricionista ficam como estão
    await db.execute(
        update(RotinaAlimentar)
        .where(
            RotinaAlimentar.paciente_id == current_user.id,
            RotinaAlimentar.origem == "app",
            RotinaAlimentar.ativo.is_(True),
        )
        .values(ativo=False)
    )

    rotina = RotinaAlimentar(
        paciente_id=current_user.id,
        nutricionista_id=None,
        origem="app",
        titulo=f"Plano Nuvvia · {OBJETIVO_TEXTO[respostas.objetivo].lower()}",
        objetivo=respostas.objetivo,
        data_inicio=date.today(),
        explicacao=texto_explicacao(respostas, calculo, semana[0]),
        refeicoes=[
            PlanoAlimentar(
                nome=r.nome,
                horario=r.horario,
                dia_semana=dia,
                descricao=r.descricao(),
                meta_calorias=r.total("kcal"),
                meta_proteina_g=r.total("proteina"),
                meta_carboidratos_g=r.total("carboidrato"),
                meta_gordura_g=r.total("gordura"),
            )
            for dia, refeicoes in enumerate(semana)
            for r in refeicoes
        ],
    )
    db.add(rotina)
    await db.commit()
    await db.refresh(rotina, attribute_names=["refeicoes", "criacao_data"])

    return ResultadoQuestionario(
        modo="app",
        recomendacao_consulta=False,
        metas=calculo.metas,
        calculos={
            "idade": calculo.idade,
            "imc": calculo.imc,
            "tmb": calculo.tmb,
            "fator_atividade": calculo.fator_atividade,
            "gasto_total": calculo.gasto_total,
            "ajuste": calculo.ajuste,
            "proteina_g_kg": calculo.proteina_g_kg,
            "peso_referencia": calculo.peso_referencia,
        },
        dieta=rotina,
        referencias=REFERENCIAS,
    )
