"""
Geração de dieta personalizada a partir do questionário do paciente.

Como as contas são feitas (e de onde vêm):

1. Gasto em repouso (TMB) pela equação de Mifflin-St Jeor (1990), apontada
   como a mais precisa para adultos com e sem obesidade numa revisão
   sistemática (Frankenfield et al., J Am Diet Assoc, 2005).
2. Gasto total = TMB × fator de atividade (1,2 a 1,9).
3. Ajuste pelo objetivo: déficit de 500 kcal/dia para perder peso (cerca de
   0,5 kg por semana, conforme as diretrizes clínicas do NIH, 1998), limitado
   a 25% do gasto; +300 kcal/dia para ganho muscular. Nunca abaixo de
   1.200 kcal (mulheres) ou 1.500 kcal (homens), pisos usados pelo NIH.
4. Proteína: 1,8 g/kg para perder peso ou ganhar massa e 1,4 g/kg para
   manutenção, dentro da faixa de 1,4–2,0 g/kg da posição da ISSN (Jäger et
   al., 2017). Com IMC acima de 30, usa-se o peso correspondente a IMC 25.
5. Gordura: 30% das calorias (faixa aceitável de 20–35%, IOM 2005).
   Carboidratos completam o restante, com mínimo de 130 g/dia (RDA).
6. Alimentos: comida de verdade, na linha do Guia Alimentar para a População
   Brasileira (Ministério da Saúde, 2014), com valores da tabela TACO.
   Os alimentos de que a pessoa gosta têm prioridade e os que ela evita ficam
   de fora: o que mais pesa no resultado de uma dieta é conseguir segui-la
   (Dansinger et al., JAMA, 2005), não o tipo de dieta.

O app não monta a dieta quando a situação pede acompanhamento profissional
(menores de 18 anos, gestantes/lactantes, condições de saúde, baixo peso com
objetivo de emagrecer); nesses casos recomenda uma consulta.
"""
from dataclasses import dataclass
from datetime import date

from app.models.dieta import DietaMeta
from app.schemas.questionario import Metas, Referencia, RespostasQuestionario
from app.services.alimentos import ALIMENTOS, Alimento, permitido

FATORES_ATIVIDADE = {
    "sedentario": 1.2,
    "leve": 1.375,
    "moderado": 1.55,
    "alto": 1.725,
    "muito_alto": 1.9,
}

PROTEINA_G_KG = {
    DietaMeta.PERDER_PESO: 1.8,
    DietaMeta.GANHO_MUSCULAR: 1.8,
    DietaMeta.MANUTENCAO: 1.4,
    DietaMeta.CONDICAO_SAUDE: 1.4,
}

OBJETIVO_TEXTO = {
    DietaMeta.PERDER_PESO: "Emagrecimento",
    DietaMeta.GANHO_MUSCULAR: "Hipertrofia",
    DietaMeta.MANUTENCAO: "Manutenção",
    DietaMeta.CONDICAO_SAUDE: "Condição de saúde",
}

REFERENCIAS = [
    Referencia(
        titulo="Frankenfield et al. (2005). Comparação de equações de gasto em repouso: Mifflin-St Jeor foi a mais precisa. J Am Diet Assoc.",
        url="https://pubmed.ncbi.nlm.nih.gov/15883556/",
    ),
    Referencia(
        titulo="Jäger et al. (2017). Posição da ISSN sobre proteína e exercício: 1,4–2,0 g/kg/dia. J Int Soc Sports Nutr.",
        url="https://pubmed.ncbi.nlm.nih.gov/28642676/",
    ),
    Referencia(
        titulo="Dansinger et al. (2005). Atkins, Ornish, Vigilantes do Peso e Zona: a adesão, não o tipo de dieta, explicou a perda de peso. JAMA.",
        url="https://pubmed.ncbi.nlm.nih.gov/15632335/",
    ),
    Referencia(
        titulo="Ministério da Saúde (2014). Guia Alimentar para a População Brasileira, 2ª edição.",
        url="https://www.gov.br/saude/pt-br/assuntos/saude-brasil/publicacoes-para-promocao-a-saude/guia_alimentar_populacao_brasileira_2ed.pdf",
    ),
    Referencia(
        titulo="NEPA/UNICAMP (2011). Tabela Brasileira de Composição de Alimentos (TACO), 4ª edição.",
        url="https://www.cfn.org.br/wp-content/uploads/2017/03/taco_4_edicao_ampliada_e_revisada.pdf",
    ),
]

# (nome, horário, fração das calorias do dia, tipo de refeição)
ESTRUTURAS = {
    3: [("Café da manhã", "07:30", 0.30, "cafe"), ("Almoço", "12:30", 0.40, "principal"), ("Jantar", "19:30", 0.30, "principal")],
    4: [
        ("Café da manhã", "07:30", 0.25, "cafe"),
        ("Almoço", "12:30", 0.35, "principal"),
        ("Lanche da tarde", "16:00", 0.10, "cafe"),
        ("Jantar", "19:30", 0.30, "principal"),
    ],
    5: [
        ("Café da manhã", "07:30", 0.20, "cafe"),
        ("Lanche da manhã", "10:00", 0.10, "cafe"),
        ("Almoço", "12:30", 0.30, "principal"),
        ("Lanche da tarde", "16:00", 0.15, "cafe"),
        ("Jantar", "19:30", 0.25, "principal"),
    ],
    6: [
        ("Café da manhã", "07:00", 0.20, "cafe"),
        ("Lanche da manhã", "10:00", 0.10, "cafe"),
        ("Almoço", "12:30", 0.30, "principal"),
        ("Lanche da tarde", "16:00", 0.10, "cafe"),
        ("Jantar", "19:30", 0.25, "principal"),
        ("Ceia", "21:30", 0.05, "cafe"),
    ],
}

# Medidas caseiras para alguns itens: (gramas por unidade, nome da unidade)
UNIDADES = {
    "ovo": (50, "unidade", "unidades"),
    "pao_frances": (50, "unidade", "unidades"),
    "banana": (70, "unidade", "unidades"),
    "maca": (130, "unidade", "unidades"),
    "laranja": (140, "unidade", "unidades"),
}


def idade_em(nascimento: date, hoje: date | None = None) -> int:
    hoje = hoje or date.today()
    anos = hoje.year - nascimento.year
    if (hoje.month, hoje.day) < (nascimento.month, nascimento.day):
        anos -= 1
    return anos


def motivo_para_consulta(r: RespostasQuestionario) -> str | None:
    """Situações em que uma dieta automática não é adequada."""
    idade = idade_em(r.data_nascimento)
    imc = r.peso_kg / (r.altura_cm / 100) ** 2
    if idade < 18:
        return "Para menores de 18 anos, a alimentação precisa ser planejada por uma nutricionista."
    if "gestante_lactante" in r.condicoes_saude:
        return "Na gestação e na amamentação as necessidades mudam bastante; uma nutricionista precisa montar o plano."
    if r.condicoes_saude:
        return "Com uma condição de saúde, a dieta precisa considerar exames e medicamentos. Recomendamos uma consulta."
    if r.objetivo == DietaMeta.CONDICAO_SAUDE:
        return "Para tratar uma condição de saúde, a dieta precisa ser feita por uma nutricionista."
    if imc < 18.5 and r.objetivo == DietaMeta.PERDER_PESO:
        return "Seu IMC já está abaixo de 18,5. Perder mais peso pode fazer mal; converse com uma nutricionista."
    return None


@dataclass
class Calculo:
    idade: int
    imc: float
    tmb: float
    fator_atividade: float
    gasto_total: float
    ajuste: float
    peso_referencia: float
    proteina_g_kg: float
    metas: Metas


def calcular_metas(r: RespostasQuestionario) -> Calculo:
    idade = idade_em(r.data_nascimento)
    altura_m = r.altura_cm / 100
    imc = r.peso_kg / altura_m**2
    masculino = r.sexo == "masculino"

    tmb = 10 * r.peso_kg + 6.25 * r.altura_cm - 5 * idade + (5 if masculino else -161)
    fator = FATORES_ATIVIDADE[r.nivel_atividade]
    gasto = tmb * fator

    if r.objetivo == DietaMeta.PERDER_PESO:
        ajuste = -min(500.0, 0.25 * gasto)
    elif r.objetivo == DietaMeta.GANHO_MUSCULAR:
        ajuste = 300.0
    else:
        ajuste = 0.0
    piso = 1500 if masculino else 1200
    kcal = round(max(gasto + ajuste, piso) / 10) * 10

    peso_ref = 25 * altura_m**2 if imc > 30 else r.peso_kg
    g_kg = PROTEINA_G_KG[r.objetivo]
    proteina = round(g_kg * peso_ref)
    gordura = round(0.30 * kcal / 9)
    carbo = round((kcal - proteina * 4 - gordura * 9) / 4)
    if carbo < 130:
        gordura = round(0.25 * kcal / 9)
        carbo = round((kcal - proteina * 4 - gordura * 9) / 4)

    return Calculo(
        idade=idade,
        imc=round(imc, 1),
        tmb=round(tmb),
        fator_atividade=fator,
        gasto_total=round(gasto),
        ajuste=round(ajuste),
        peso_referencia=round(peso_ref, 1),
        proteina_g_kg=g_kg,
        metas=Metas(calorias=kcal, proteina_g=proteina, carboidratos_g=max(carbo, 0), gordura_g=gordura),
    )


# ---- Montagem das refeições ----


def _arred5(x: float) -> int:
    return int(round(x / 5) * 5)


class _Seletor:
    """Escolhe alimentos permitidos, dando prioridade aos preferidos e variando entre refeições."""

    def __init__(self, r: RespostasQuestionario, dia: int = 0, ontem: set[str] | None = None):
        self.r = r
        self.dia = dia
        # Alimentos do dia anterior perdem prioridade, para o cardápio não se repetir
        self.ontem = ontem or set()
        self.evitados = set(r.alimentos_evitados)
        self.preferidos = set(r.alimentos_preferidos)
        # Quantas vezes cada alimento já entrou no cardápio do dia
        self.usos: dict[str, int] = {}

    def _pontos(self, a: Alimento) -> float:
        pontos = 2.0 if a.id in self.preferidos else 0.0
        if self.r.tempo_cozinhar == "pouco" and "pratico" in a.etiquetas:
            pontos += 1
        # Cada repetição no mesmo dia pesa contra, para variar sem abandonar os preferidos
        if a.id in self.ontem:
            # Maior que o bônus de preferido: o favorito volta em dias alternados
            pontos -= 2.5
        return pontos - 1.5 * self.usos.get(a.id, 0)

    def candidatos(self, grupo: str, tipo: str) -> list[Alimento]:
        return [
            a
            for a in ALIMENTOS
            if a.grupo == grupo and tipo in a.refeicoes and permitido(a, self.r.restricoes, self.evitados)
        ]

    def escolher(self, grupo: str, tipo: str, excluir: set[str] = frozenset()) -> Alimento | None:
        lista = [a for a in self.candidatos(grupo, tipo) if a.id not in excluir]
        if not lista:
            return None
        # Nos empates, a ordem gira conforme o dia da semana, variando as escolhas
        n = len(lista)
        escolhido = max(
            enumerate(lista), key=lambda par: (self._pontos(par[1]), -((par[0] - self.dia * 3) % n))
        )[1]
        self.usos[escolhido.id] = self.usos.get(escolhido.id, 0) + 1
        return escolhido


@dataclass
class Item:
    alimento: Alimento
    gramas: int

    def total(self, nutriente: str) -> float:
        return self.alimento.por_grama(nutriente) * self.gramas

    def texto(self) -> str:
        unidade = UNIDADES.get(self.alimento.id)
        if unidade:
            g_un, singular, plural = unidade
            n = max(1, round(self.gramas / g_un))
            return f"{self.alimento.nome} — {self.gramas} g (≈ {n} {singular if n == 1 else plural})"
        return f"{self.alimento.nome} — {self.gramas} g"


def _gramas_por_unidade(alimento: Alimento, gramas: float) -> int:
    unidade = UNIDADES.get(alimento.id)
    if unidade:
        return max(1, round(gramas / unidade[0])) * unidade[0]
    return _arred5(gramas)


def _refeicao_principal(sel: _Seletor, kcal: float, prot: float) -> list[Item]:
    itens: list[Item] = []
    usados: set[str] = set()
    for _ in range(2):
        veg = sel.escolher("vegetal", "principal", usados)
        if veg:
            itens.append(Item(veg, 60))
            usados.add(veg.id)
    leg = sel.escolher("leguminosa", "principal")
    if leg:
        itens.append(Item(leg, 80))
    azeite = sel.escolher("gordura", "principal")
    if azeite:
        itens.append(Item(azeite, 5))

    fonte = sel.escolher("proteina", "principal")
    if fonte:
        falta = max(prot - sum(i.total("proteina") for i in itens), prot * 0.5)
        gramas = min(max(falta / fonte.por_grama("proteina"), 60), 250)
        itens.append(Item(fonte, _gramas_por_unidade(fonte, gramas)))

    base = sel.escolher("carboidrato", "principal")
    if base:
        resto = kcal - sum(i.total("kcal") for i in itens)
        gramas = min(resto / base.por_grama("kcal"), 350)
        if gramas >= 30:
            itens.append(Item(base, _arred5(gramas)))
    return itens


def _refeicao_leve(sel: _Seletor, kcal: float, prot: float, lanche: bool) -> list[Item]:
    """
    Café da manhã: fruta + proteína + carboidrato. Lanche: fruta + proteína.
    A proteína ocupa no máximo uma fatia das calorias da refeição, para o
    café não virar um prato de ovos; o que faltar vai para almoço e jantar.
    """
    itens: list[Item] = []

    fruta = sel.escolher("fruta", "cafe")
    if fruta:
        alvo = kcal * (0.45 if lanche else 0.2)
        itens.append(Item(fruta, _gramas_por_unidade(fruta, min(max(alvo / fruta.por_grama("kcal"), 70), 200))))

    fonte = sel.escolher("proteina", "cafe") or sel.escolher("gordura", "cafe")
    if fonte:
        restante = kcal - sum(i.total("kcal") for i in itens)
        teto_kcal = restante * (0.9 if lanche else 0.5)
        gramas = prot / max(fonte.por_grama("proteina"), 0.01)
        gramas = min(gramas, teto_kcal / fonte.por_grama("kcal"), 30 if fonte.grupo == "gordura" else 200)
        if gramas >= 10:
            itens.append(Item(fonte, _gramas_por_unidade(fonte, gramas)))

    if not lanche:
        base = sel.escolher("carboidrato", "cafe")
        if base:
            resto = kcal - sum(i.total("kcal") for i in itens)
            gramas = min(max(resto / base.por_grama("kcal"), 20), 150)
            itens.append(Item(base, _gramas_por_unidade(base, gramas)))
    return itens


@dataclass
class RefeicaoGerada:
    nome: str
    horario: str
    itens: list[Item]

    def total(self, nutriente: str) -> float:
        return round(sum(i.total(nutriente) for i in self.itens), 1)

    def descricao(self) -> str:
        return " · ".join(i.texto() for i in self.itens)


def montar_refeicoes(
    r: RespostasQuestionario, metas: Metas, dia: int = 0, ontem: set[str] | None = None
) -> list[RefeicaoGerada]:
    sel = _Seletor(r, dia, ontem)
    estrutura = ESTRUTURAS[r.refeicoes_por_dia]
    montadas: dict[int, list[Item]] = {}

    # 1) Café e lanches primeiro
    for i, (nome, _, fracao, tipo) in enumerate(estrutura):
        if tipo == "cafe":
            montadas[i] = _refeicao_leve(
                sel, metas.calorias * fracao, metas.proteina_g * fracao, lanche=not nome.startswith("Café")
            )

    # 2) A proteína que faltou nas refeições leves é dividida entre almoço e jantar
    prot_leves = sum(item.total("proteina") for itens in montadas.values() for item in itens)
    principais = [(i, fracao) for i, (_, _, fracao, tipo) in enumerate(estrutura) if tipo == "principal"]
    fracao_principais = sum(f for _, f in principais)
    prot_restante = max(metas.proteina_g - prot_leves, 0)
    for i, fracao in principais:
        montadas[i] = _refeicao_principal(sel, metas.calorias * fracao, prot_restante * fracao / fracao_principais)

    return [RefeicaoGerada(nome, horario, montadas[i]) for i, (nome, horario, _, _) in enumerate(estrutura)]


DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]


def montar_semana(r: RespostasQuestionario, metas: Metas) -> list[list[RefeicaoGerada]]:
    """
    Sete cardápios (segunda a domingo) com as mesmas metas diárias. Cada dia
    evita repetir o que foi servido no anterior, sem deixar de lado os
    alimentos preferidos, para a dieta não cair na rotina.
    """
    semana: list[list[RefeicaoGerada]] = []
    ontem: set[str] = set()
    for dia in range(7):
        refeicoes = montar_refeicoes(r, metas, dia, ontem)
        semana.append(refeicoes)
        ontem = {
            i.alimento.id for ref in refeicoes for i in ref.itens if i.alimento.grupo not in ("vegetal", "gordura")
        }
    return semana


def texto_explicacao(r: RespostasQuestionario, c: Calculo, refeicoes: list[RefeicaoGerada]) -> str:
    total = {n: round(sum(x.total(n) for x in refeicoes)) for n in ("kcal", "proteina", "carboidrato", "gordura")}
    objetivo = OBJETIVO_TEXTO[r.objetivo].lower()
    linhas = [
        f"Seu gasto em repouso estimado é de {c.tmb} kcal (equação de Mifflin-St Jeor).",
        f"Com seu nível de atividade (fator {c.fator_atividade}), o gasto total fica em torno de {c.gasto_total} kcal por dia.",
    ]
    if c.ajuste < 0:
        linhas.append(f"Para {objetivo}, tiramos {abs(c.ajuste)} kcal por dia, um ritmo de cerca de meio quilo por semana.")
    elif c.ajuste > 0:
        linhas.append(f"Para {objetivo}, somamos {c.ajuste} kcal por dia.")
    linhas.append(
        f"Meta diária: {c.metas.calorias:.0f} kcal, {c.metas.proteina_g:.0f} g de proteína "
        f"({c.proteina_g_kg} g por kg), {c.metas.carboidratos_g:.0f} g de carboidratos e {c.metas.gordura_g:.0f} g de gordura."
    )
    if c.peso_referencia != r.peso_kg:
        linhas.append(f"A proteína foi calculada sobre {c.peso_referencia} kg, o peso de referência para IMC 25.")
    linhas.append(
        f"O cardápio soma cerca de {total['kcal']} kcal e {total['proteina']} g de proteína; as quantidades foram arredondadas para facilitar o preparo."
    )
    linhas.append(
        "Demos prioridade aos alimentos que você disse gostar e tiramos os que você evita: o que mais pesa no resultado é conseguir seguir a dieta."
    )
    linhas.append(
        "O cardápio muda a cada dia da semana, com as mesmas metas, para variar sem sair do plano."
    )
    linhas.append("Este plano é um ponto de partida e não substitui o acompanhamento de uma nutricionista.")
    return "\n".join(linhas)
