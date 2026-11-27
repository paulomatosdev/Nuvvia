from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.schemas.registro_alimentar import AlimentoCatalogo, MedidaCaseira
from app.services.alimentos import ALIMENTOS, medidas_de

router = APIRouter(prefix="/alimentos", tags=["Alimentos"])


@router.get("", response_model=list[AlimentoCatalogo], dependencies=[Depends(get_current_user)])
async def listar_alimentos():
    """Catálogo de alimentos (valores por 100 g, TACO/USDA) com medidas caseiras."""
    return [
        AlimentoCatalogo(
            id=a.id,
            nome=a.nome,
            grupo=a.grupo,
            kcal=a.kcal,
            proteina=a.proteina,
            carboidrato=a.carboidrato,
            gordura=a.gordura,
            medidas=[MedidaCaseira(nome=n, gramas=g) for n, g in medidas_de(a.id)],
            fonte=a.fonte,
        )
        for a in sorted(ALIMENTOS, key=lambda a: a.nome)
    ]
