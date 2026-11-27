from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_role
from app.database import get_db
from app.models.registro_alimentar import FonteRegistro, RegistroAlimentar
from app.models.usuario import PerfilAcesso, Usuario
from app.schemas.registro_alimentar import (
    RegistroAlimentarLer,
    RegistroAlimentarManualCriar,
    RegistroPorItensCriar,
    ResumoMacrosDiario,
)
from app.services.ai_macro_service import estimate_macros_from_photo
from app.services.alimentos import POR_ID
from app.services.resumo import inicio_do_dia, resumo_do_dia
from app.services.uploads import EXTENSOES_IMAGEM, salvar_upload

router = APIRouter(prefix="/registros-alimentares", tags=["Diário de refeições"])

somente_paciente = require_role(PerfilAcesso.PACIENTE)


@router.post("/foto", response_model=RegistroAlimentarLer, status_code=201)
async def registrar_por_foto(
    arquivo: UploadFile = File(...),
    current_user: Usuario = Depends(somente_paciente),
    db: AsyncSession = Depends(get_db),
):
    caminho, conteudo = await salvar_upload(arquivo, "fotos_refeicoes", EXTENSOES_IMAGEM)
    estimativa = await estimate_macros_from_photo(conteudo)

    registro = RegistroAlimentar(
        paciente_id=current_user.id,
        fonte=FonteRegistro.FOTO_IA,
        foto_url=str(caminho),
        **estimativa.model_dump(),
    )
    db.add(registro)
    await db.commit()
    await db.refresh(registro)
    return registro


@router.post("/manual", response_model=RegistroAlimentarLer, status_code=201)
async def registrar_manualmente(
    payload: RegistroAlimentarManualCriar,
    current_user: Usuario = Depends(somente_paciente),
    db: AsyncSession = Depends(get_db),
):
    registro = RegistroAlimentar(
        paciente_id=current_user.id,
        fonte=FonteRegistro.MANUAL,
        **payload.model_dump(),
    )
    db.add(registro)
    await db.commit()
    await db.refresh(registro)
    return registro


def _formatar_gramas(g: float) -> str:
    return f"{g:.0f} g" if g == int(g) else f"{g:.1f} g".replace(".", ",")


@router.post("/itens", response_model=RegistroAlimentarLer, status_code=201)
async def registrar_por_itens(
    payload: RegistroPorItensCriar,
    current_user: Usuario = Depends(somente_paciente),
    db: AsyncSession = Depends(get_db),
):
    """
    O paciente informa só os alimentos e as quantidades; calorias e macros
    vêm da base de alimentos (valores por 100 g da TACO/USDA).
    """
    desconhecidos = [i.alimento_id for i in payload.itens if i.alimento_id not in POR_ID]
    if desconhecidos:
        raise HTTPException(status_code=422, detail=f"Alimentos desconhecidos: {', '.join(desconhecidos)}")

    totais = {"calorias": 0.0, "proteina_g": 0.0, "carboidratos_g": 0.0, "gordura_g": 0.0}
    partes = []
    for item in payload.itens:
        a = POR_ID[item.alimento_id]
        totais["calorias"] += a.kcal * item.gramas / 100
        totais["proteina_g"] += a.proteina * item.gramas / 100
        totais["carboidratos_g"] += a.carboidrato * item.gramas / 100
        totais["gordura_g"] += a.gordura * item.gramas / 100
        partes.append(f"{a.nome} ({_formatar_gramas(item.gramas)})")

    descricao = ", ".join(partes)
    if payload.nome and payload.nome.strip():
        descricao = f"{payload.nome.strip()}: {descricao}"

    registro = RegistroAlimentar(
        paciente_id=current_user.id,
        fonte=FonteRegistro.MANUAL,
        descricao=descricao[:1000],
        **{k: round(v, 1) for k, v in totais.items()},
    )
    db.add(registro)
    await db.commit()
    await db.refresh(registro)
    return registro


@router.get("/hoje", response_model=list[RegistroAlimentarLer])
async def listar_registros_de_hoje(
    current_user: Usuario = Depends(somente_paciente),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(RegistroAlimentar)
        .where(
            RegistroAlimentar.paciente_id == current_user.id,
            RegistroAlimentar.registro_data >= inicio_do_dia(),
        )
        .order_by(RegistroAlimentar.registro_data)
    )
    return (await db.scalars(stmt)).all()


@router.get("/resumo/hoje", response_model=ResumoMacrosDiario)
async def resumo_de_hoje(
    current_user: Usuario = Depends(somente_paciente),
    db: AsyncSession = Depends(get_db),
):
    return await resumo_do_dia(db, current_user)
