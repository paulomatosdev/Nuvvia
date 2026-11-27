"""
Base de alimentos usada para montar as dietas do app.

Valores por 100 g do alimento como é consumido (cozido, quando é o caso).
Fonte principal: Tabela Brasileira de Composição de Alimentos (TACO),
4ª ed., NEPA/UNICAMP, 2011. Itens marcados com fonte "USDA" vêm do
USDA FoodData Central (alimentos que a TACO não traz).

Etiquetas:
- carne: excluído para vegetarianos e veganos
- animal: excluído para veganos
- lactose / gluten: excluídos para quem evita
- pratico: pronto em poucos minutos (prioridade para quem tem pouco tempo)
"""
from dataclasses import dataclass, field


@dataclass(frozen=True)
class Alimento:
    id: str
    nome: str
    grupo: str  # proteina | leguminosa | carboidrato | fruta | vegetal | gordura | laticinio | bebida | doce
    kcal: float
    proteina: float
    carboidrato: float
    gordura: float
    refeicoes: frozenset[str]  # "cafe" e/ou "principal"; vazio = só para registro no diário
    etiquetas: frozenset[str] = field(default_factory=frozenset)
    fonte: str = "TACO"

    def por_grama(self, nutriente: str) -> float:
        return getattr(self, nutriente) / 100


def _a(id, nome, grupo, kcal, p, c, g, refeicoes, etiquetas=(), fonte="TACO"):
    return Alimento(id, nome, grupo, kcal, p, c, g, frozenset(refeicoes), frozenset(etiquetas), fonte)


CAFE = ("cafe",)
PRINCIPAL = ("principal",)
AMBOS = ("cafe", "principal")

ALIMENTOS: list[Alimento] = [
    # Proteínas
    _a("frango", "Peito de frango grelhado", "proteina", 159, 32.0, 0.0, 2.5, PRINCIPAL, ("carne", "animal")),
    _a("patinho", "Carne bovina (patinho) grelhada", "proteina", 219, 35.9, 0.0, 7.3, PRINCIPAL, ("carne", "animal")),
    _a("tilapia", "Tilápia grelhada", "proteina", 128, 26.2, 0.0, 2.7, PRINCIPAL, ("carne", "animal"), "USDA"),
    _a("atum", "Atum em conserva (em água)", "proteina", 116, 25.5, 0.0, 0.8, PRINCIPAL, ("carne", "animal", "pratico"), "USDA"),
    _a("ovo", "Ovo cozido", "proteina", 146, 13.3, 0.6, 9.5, AMBOS, ("animal", "pratico")),
    _a("tofu", "Tofu firme", "proteina", 144, 15.8, 2.8, 8.7, AMBOS, ("pratico",), "USDA"),
    _a("iogurte", "Iogurte natural", "proteina", 51, 4.1, 1.9, 3.0, CAFE, ("animal", "lactose", "pratico")),
    _a("queijo_minas", "Queijo minas frescal", "proteina", 264, 17.4, 3.2, 20.2, CAFE, ("animal", "lactose", "pratico")),
    # Leguminosas
    _a("feijao_carioca", "Feijão carioca cozido", "leguminosa", 76, 4.8, 13.6, 0.5, PRINCIPAL),
    _a("feijao_preto", "Feijão preto cozido", "leguminosa", 77, 4.5, 14.0, 0.5, PRINCIPAL),
    _a("lentilha", "Lentilha cozida", "leguminosa", 93, 6.3, 16.3, 0.5, PRINCIPAL),
    _a("grao_de_bico", "Grão-de-bico cozido", "leguminosa", 164, 8.9, 27.4, 2.6, PRINCIPAL, (), "USDA"),
    # Carboidratos
    _a("arroz_branco", "Arroz branco cozido", "carboidrato", 128, 2.5, 28.1, 0.2, PRINCIPAL),
    _a("arroz_integral", "Arroz integral cozido", "carboidrato", 124, 2.6, 25.8, 1.0, PRINCIPAL),
    _a("batata_doce", "Batata-doce cozida", "carboidrato", 77, 0.6, 18.4, 0.1, PRINCIPAL),
    _a("batata", "Batata inglesa cozida", "carboidrato", 52, 1.2, 11.9, 0.0, PRINCIPAL),
    _a("mandioca", "Mandioca cozida", "carboidrato", 125, 0.6, 30.1, 0.3, PRINCIPAL),
    _a("macarrao", "Macarrão cozido", "carboidrato", 158, 5.8, 30.9, 0.9, PRINCIPAL, ("gluten",), "USDA"),
    _a("cuscuz", "Cuscuz de milho cozido", "carboidrato", 113, 2.2, 25.3, 0.7, AMBOS, ("pratico",)),
    _a("pao_frances", "Pão francês", "carboidrato", 300, 8.0, 58.6, 3.1, CAFE, ("gluten", "pratico")),
    _a("pao_integral", "Pão integral", "carboidrato", 253, 9.4, 49.9, 3.7, CAFE, ("gluten", "pratico")),
    _a("tapioca", "Tapioca (goma)", "carboidrato", 240, 0.0, 59.0, 0.0, CAFE, ("pratico",)),
    _a("aveia", "Aveia em flocos", "carboidrato", 394, 13.9, 66.6, 8.5, CAFE, ("gluten", "pratico")),
    # Frutas
    _a("banana", "Banana prata", "fruta", 98, 1.3, 26.0, 0.1, CAFE, ("pratico",)),
    _a("maca", "Maçã", "fruta", 56, 0.3, 15.2, 0.0, CAFE, ("pratico",)),
    _a("mamao", "Mamão papaia", "fruta", 40, 0.5, 10.4, 0.1, CAFE, ("pratico",)),
    _a("laranja", "Laranja", "fruta", 37, 1.0, 8.9, 0.1, CAFE, ("pratico",)),
    _a("morango", "Morango", "fruta", 30, 0.9, 6.8, 0.3, CAFE, ("pratico",)),
    _a("abacate", "Abacate", "fruta", 96, 1.2, 6.0, 8.4, CAFE, ("pratico",)),
    # Vegetais
    _a("brocolis", "Brócolis cozido", "vegetal", 25, 2.1, 4.4, 0.5, PRINCIPAL),
    _a("alface", "Alface", "vegetal", 11, 1.3, 1.7, 0.2, PRINCIPAL, ("pratico",)),
    _a("tomate", "Tomate", "vegetal", 15, 1.1, 3.1, 0.2, PRINCIPAL, ("pratico",)),
    _a("cenoura", "Cenoura crua", "vegetal", 34, 1.3, 7.7, 0.2, PRINCIPAL, ("pratico",)),
    _a("abobrinha", "Abobrinha cozida", "vegetal", 15, 1.1, 3.0, 0.2, PRINCIPAL),
    _a("couve", "Couve", "vegetal", 27, 2.9, 4.3, 0.5, PRINCIPAL),
    # Gorduras
    _a("azeite", "Azeite de oliva", "gordura", 884, 0.0, 0.0, 100.0, PRINCIPAL, ("pratico",)),
    _a("pasta_amendoim", "Pasta de amendoim", "gordura", 588, 25.0, 20.0, 50.0, CAFE, ("pratico",), "USDA"),
    _a("castanha_para", "Castanha-do-pará", "gordura", 643, 14.5, 15.1, 63.5, CAFE, ("pratico",)),
]

NENHUMA: tuple[str, ...] = ()  # só para registro do diário; o gerador de dieta não usa

# Alimentos comuns no dia a dia, para o paciente registrar o que comeu.
ALIMENTOS += [
    # Pães, cereais e massas
    _a("pao_forma", "Pão de forma branco", "carboidrato", 266, 8.9, 49.0, 3.3, NENHUMA, ("gluten",), "USDA"),
    _a("pao_queijo", "Pão de queijo assado", "carboidrato", 363, 5.1, 34.2, 24.6, NENHUMA, ("lactose", "animal")),
    _a("cream_cracker", "Biscoito cream cracker", "carboidrato", 432, 10.1, 68.7, 14.4, NENHUMA, ("gluten",)),
    _a("farinha_mandioca", "Farinha de mandioca torrada", "carboidrato", 365, 1.2, 89.2, 0.3, NENHUMA),
    _a("milho_verde", "Milho verde (enlatado, drenado)", "carboidrato", 98, 3.2, 17.1, 2.4, NENHUMA),
    _a("batata_frita", "Batata frita", "carboidrato", 267, 5.0, 35.6, 13.1, NENHUMA),
    # Carnes, ovos e peixes
    _a("contrafile", "Bife de contrafilé grelhado", "proteina", 278, 32.4, 0.0, 15.5, NENHUMA, ("carne", "animal")),
    _a("carne_moida", "Carne moída (acém) cozida", "proteina", 212, 26.7, 0.0, 10.9, NENHUMA, ("carne", "animal")),
    _a("coxa_frango", "Coxa de frango assada com pele", "proteina", 215, 28.5, 0.0, 10.4, NENHUMA, ("carne", "animal")),
    _a("ovo_frito", "Ovo frito", "proteina", 240, 15.6, 1.2, 18.6, NENHUMA, ("animal",)),
    _a("presunto", "Presunto", "proteina", 94, 14.3, 2.1, 2.7, NENHUMA, ("carne", "animal")),
    _a("sardinha", "Sardinha em conserva (em óleo)", "proteina", 285, 15.9, 0.0, 24.0, NENHUMA, ("carne", "animal")),
    _a("salmao", "Salmão grelhado", "proteina", 206, 22.1, 0.0, 12.4, NENHUMA, ("carne", "animal"), "USDA"),
    # Laticínios
    _a("leite_integral", "Leite integral", "laticinio", 61, 2.9, 4.3, 3.2, NENHUMA, ("animal", "lactose")),
    _a("leite_desnatado", "Leite desnatado", "laticinio", 35, 3.4, 4.9, 0.1, NENHUMA, ("animal", "lactose")),
    _a("mussarela", "Queijo muçarela", "laticinio", 330, 22.6, 3.0, 25.2, NENHUMA, ("animal", "lactose")),
    _a("requeijao", "Requeijão cremoso", "laticinio", 257, 9.6, 2.4, 23.4, NENHUMA, ("animal", "lactose")),
    _a("manteiga", "Manteiga com sal", "gordura", 726, 0.4, 0.1, 82.4, NENHUMA, ("animal", "lactose")),
    # Leguminosas e oleaginosas
    _a("ervilha", "Ervilha (enlatada, drenada)", "leguminosa", 74, 4.6, 13.4, 0.4, NENHUMA),
    _a("amendoim", "Amendoim torrado", "gordura", 606, 22.5, 18.7, 54.0, NENHUMA),
    _a("castanha_caju", "Castanha de caju torrada", "gordura", 570, 18.5, 29.1, 46.3, NENHUMA),
    # Verduras e legumes
    _a("beterraba", "Beterraba cozida", "vegetal", 32, 1.3, 7.2, 0.1, NENHUMA),
    _a("pepino", "Pepino", "vegetal", 10, 0.9, 2.0, 0.0, NENHUMA),
    _a("repolho", "Repolho cru", "vegetal", 17, 0.9, 3.9, 0.1, NENHUMA),
    _a("cebola", "Cebola crua", "vegetal", 39, 1.7, 8.9, 0.1, NENHUMA),
    _a("abobora", "Abóbora cabotiá cozida", "vegetal", 48, 1.4, 10.8, 0.7, NENHUMA),
    _a("chuchu", "Chuchu cozido", "vegetal", 19, 0.4, 4.8, 0.0, NENHUMA),
    # Frutas
    _a("uva", "Uva", "fruta", 53, 0.7, 13.6, 0.2, NENHUMA),
    _a("manga", "Manga", "fruta", 51, 0.9, 12.8, 0.2, NENHUMA),
    _a("melancia", "Melancia", "fruta", 33, 0.9, 8.1, 0.0, NENHUMA),
    _a("abacaxi", "Abacaxi", "fruta", 48, 0.9, 12.3, 0.1, NENHUMA),
    _a("pera", "Pera", "fruta", 53, 0.6, 14.0, 0.1, NENHUMA),
    _a("kiwi", "Kiwi", "fruta", 51, 1.3, 11.5, 0.6, NENHUMA),
    _a("goiaba", "Goiaba", "fruta", 54, 1.1, 13.0, 0.4, NENHUMA),
    _a("acai", "Açaí (polpa, sem açúcar)", "fruta", 58, 0.8, 6.2, 3.9, NENHUMA),
    # Bebidas
    _a("cafe_coado", "Café coado sem açúcar", "bebida", 9, 0.7, 1.5, 0.1, NENHUMA),
    _a("suco_laranja", "Suco de laranja natural", "bebida", 33, 0.7, 7.6, 0.1, NENHUMA),
    _a("refrigerante", "Refrigerante de cola", "bebida", 42, 0.0, 10.6, 0.0, NENHUMA, (), "USDA"),
    # A maior parte das calorias da cerveja vem do álcool (7 kcal/g), fora dos macros
    _a("cerveja", "Cerveja", "bebida", 41, 0.3, 3.3, 0.0, NENHUMA, ("gluten", "alcool")),
    # Doces
    _a("acucar", "Açúcar refinado", "doce", 387, 0.3, 99.5, 0.0, NENHUMA),
    _a("mel", "Mel", "doce", 309, 0.0, 84.0, 0.0, NENHUMA, ("animal",)),
    _a("chocolate_leite", "Chocolate ao leite", "doce", 540, 7.2, 59.6, 30.3, NENHUMA, ("animal", "lactose")),
]

POR_ID: dict[str, Alimento] = {a.id: a for a in ALIMENTOS}

# Medidas caseiras (nome, gramas) para o paciente registrar sem balança.
# Pesos de referência aproximados; bebidas em ml ≈ g.
MEDIDAS: dict[str, list[tuple[str, float]]] = {
    "ovo": [("unidade", 50)],
    "ovo_frito": [("unidade", 50)],
    "pao_frances": [("unidade", 50)],
    "pao_forma": [("fatia", 25)],
    "pao_integral": [("fatia", 25)],
    "pao_queijo": [("unidade média", 20)],
    "cream_cracker": [("unidade", 6)],
    "tapioca": [("unidade média", 70)],
    "aveia": [("colher de sopa", 15)],
    "cuscuz": [("fatia média", 100)],
    "arroz_branco": [("colher de sopa cheia", 25), ("escumadeira", 90)],
    "arroz_integral": [("colher de sopa cheia", 25), ("escumadeira", 90)],
    "feijao_carioca": [("concha", 140)],
    "feijao_preto": [("concha", 140)],
    "lentilha": [("concha", 140)],
    "grao_de_bico": [("colher de sopa", 25)],
    "macarrao": [("pegador", 110)],
    "batata_frita": [("porção pequena", 80)],
    "farinha_mandioca": [("colher de sopa", 15)],
    "frango": [("filé médio", 100)],
    "patinho": [("bife médio", 100)],
    "contrafile": [("bife médio", 120)],
    "carne_moida": [("colher de sopa", 25)],
    "coxa_frango": [("unidade", 90)],
    "presunto": [("fatia", 15)],
    "queijo_minas": [("fatia", 30)],
    "mussarela": [("fatia", 20)],
    "requeijao": [("colher de sopa", 30)],
    "manteiga": [("ponta de faca", 5), ("colher de chá", 5)],
    "azeite": [("colher de sopa", 8)],
    "pasta_amendoim": [("colher de sopa", 15)],
    "iogurte": [("pote", 170)],
    "leite_integral": [("copo (200 ml)", 200), ("xícara (240 ml)", 240)],
    "leite_desnatado": [("copo (200 ml)", 200), ("xícara (240 ml)", 240)],
    "banana": [("unidade", 70)],
    "maca": [("unidade", 130)],
    "laranja": [("unidade", 140)],
    "pera": [("unidade", 130)],
    "kiwi": [("unidade", 75)],
    "goiaba": [("unidade", 170)],
    "mamao": [("fatia média", 150)],
    "melancia": [("fatia média", 200)],
    "abacaxi": [("fatia", 75)],
    "castanha_para": [("unidade", 4)],
    "castanha_caju": [("unidade", 2.5)],
    "amendoim": [("punhado", 30)],
    "cafe_coado": [("xícara (50 ml)", 50)],
    "suco_laranja": [("copo (200 ml)", 200)],
    "refrigerante": [("lata (350 ml)", 350), ("copo (200 ml)", 200)],
    "cerveja": [("lata (350 ml)", 350)],
    "acucar": [("colher de chá", 5), ("colher de sopa", 12)],
    "mel": [("colher de sopa", 15)],
    "chocolate_leite": [("tablete pequeno", 25)],
}


def medidas_de(alimento_id: str) -> list[tuple[str, float]]:
    return MEDIDAS.get(alimento_id, [])

# O que cada restrição exclui
EXCLUI = {
    "vegetariano": {"carne"},
    "vegano": {"carne", "animal"},
    "sem_lactose": {"lactose"},
    "sem_gluten": {"gluten"},
}


def permitido(alimento: Alimento, restricoes: list[str], evitados: set[str]) -> bool:
    if alimento.id in evitados:
        return False
    bloqueadas = set().union(*(EXCLUI.get(r, set()) for r in restricoes)) if restricoes else set()
    return not (alimento.etiquetas & bloqueadas)
