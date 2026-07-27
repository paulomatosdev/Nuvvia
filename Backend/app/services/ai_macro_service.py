"""
Serviço responsável por analisar a foto de uma refeição e estimar
calorias/macronutrientes.

Este é um PLACEHOLDER funcional: já define a interface que o resto do
sistema vai consumir, mas a implementação real da chamada ao modelo
de visão (ex: API multimodal + base de dados nutricional tipo TACO/USDA)
ainda precisa ser conectada.

Quando formos implementar de verdade, o fluxo é:
1. Receber os bytes da imagem.
2. Enviar para um modelo com visão computacional, pedindo para
   identificar os alimentos e estimar as porções.
3. Cruzar os alimentos identificados com uma tabela nutricional
   para calcular calorias/proteínas/carboidratos/gorduras.
4. Retornar o resultado estruturado (e uma confiança da estimativa).
"""
from app.schemas.meal_log import MealLogFromPhotoResult


async def estimate_macros_from_photo(image_bytes: bytes) -> MealLogFromPhotoResult:
    """
    TODO: substituir pelo pipeline real de reconhecimento de alimentos.
    Por enquanto retorna um valor de exemplo para permitir testar o
    fluxo completo (upload -> registro -> dashboard) de ponta a ponta.
    """
    return MealLogFromPhotoResult(
        description="Refeição identificada automaticamente (exemplo - IA ainda não conectada)",
        calories=0,
        protein_g=0,
        carbs_g=0,
        fat_g=0,
        ai_confidence=0.0,
    )
