from datetime import date

from app.schemas.questionario import RespostasQuestionario
from app.services.alimentos import POR_ID
from app.services.dieta_gerador import calcular_metas, montar_refeicoes, motivo_para_consulta
from tests.conftest import criar_usuario


def respostas(**extra):
    base = dict(
        sexo="feminino",
        data_nascimento=date(1991, 3, 14),
        altura_cm=165,
        peso_kg=72,
        nivel_atividade="leve",
        objetivo="perder_peso",
        refeicoes_por_dia=4,
        tempo_cozinhar="medio",
        restricoes=[],
        condicoes_saude=[],
        alimentos_preferidos=[],
        alimentos_evitados=[],
        modo="app",
    )
    base.update(extra)
    return RespostasQuestionario(**base)


def test_calculo_mifflin_e_deficit():
    r = respostas()
    c = calcular_metas(r)
    idade = c.idade
    tmb_esperada = 10 * 72 + 6.25 * 165 - 5 * idade - 161
    assert c.tmb == round(tmb_esperada)
    assert c.gasto_total == round(tmb_esperada * 1.375)
    assert c.ajuste == -round(min(500, 0.25 * tmb_esperada * 1.375))
    assert c.metas.proteina_g == round(1.8 * 72)
    assert c.metas.carboidratos_g >= 130


def test_piso_de_calorias():
    r = respostas(peso_kg=48, altura_cm=150, nivel_atividade="sedentario", data_nascimento=date(1960, 1, 1))
    assert calcular_metas(r).metas.calorias >= 1200


def test_refeicoes_respeitam_restricoes_e_evitados():
    r = respostas(restricoes=["vegano", "sem_gluten"], alimentos_evitados=["tofu"], refeicoes_por_dia=5)
    refeicoes = montar_refeicoes(r, calcular_metas(r).metas)
    assert len(refeicoes) == 5
    for ref in refeicoes:
        for item in ref.itens:
            a = item.alimento
            assert a.id != "tofu"
            assert not ({"carne", "animal", "gluten"} & a.etiquetas), a.id


def test_preferidos_aparecem_e_calorias_proximas_da_meta():
    r = respostas(alimentos_preferidos=["patinho", "batata_doce", "banana"])
    metas = calcular_metas(r).metas
    refeicoes = montar_refeicoes(r, metas)
    usados = {i.alimento.id for ref in refeicoes for i in ref.itens}
    assert {"patinho", "batata_doce", "banana"} <= usados
    total = sum(ref.total("kcal") for ref in refeicoes)
    assert abs(total - metas.calorias) / metas.calorias < 0.15


def test_seguranca_recomenda_consulta():
    assert motivo_para_consulta(respostas(data_nascimento=date(date.today().year - 15, 1, 1)))
    assert motivo_para_consulta(respostas(condicoes_saude=["gestante_lactante"]))
    assert motivo_para_consulta(respostas(peso_kg=45, altura_cm=170))  # IMC < 18,5 querendo emagrecer
    assert motivo_para_consulta(respostas()) is None


async def test_fluxo_questionario(client):
    pac_id, pac = await criar_usuario(client, "Ana Paciente", "ana@exemplo.com", "paciente")
    _, nut = await criar_usuario(client, "Nina Nutri", "nina@exemplo.com", "nutricionista")

    assert (await client.get("/questionario/ultimo", headers=pac)).json() is None
    alimentos = (await client.get("/questionario/alimentos", headers=pac)).json()
    assert any(a["id"] == "frango" for a in alimentos)

    corpo = respostas(alimentos_preferidos=["frango"]).model_dump(mode="json")
    r = await client.post("/questionario", headers=pac, json=corpo)
    assert r.status_code == 200, r.text
    resultado = r.json()
    assert resultado["recomendacao_consulta"] is False
    assert resultado["dieta"]["origem"] == "app"
    assert resultado["dieta"]["nutricionista_id"] is None
    assert len(resultado["dieta"]["refeicoes"]) == 4 * 7  # 4 refeições x 7 dias
    assert {m["dia_semana"] for m in resultado["dieta"]["refeicoes"]} == set(range(7))
    assert len(resultado["referencias"]) >= 4

    # metas do perfil foram preenchidas e aparecem no painel do paciente
    painel = (await client.get("/pacientes/me", headers=pac)).json()
    assert painel["macros_hoje"]["meta_calorias"] == resultado["metas"]["calorias"]

    # refazer desativa a dieta anterior do app
    await client.post("/questionario", headers=pac, json=corpo)
    dietas = (await client.get(f"/dietas/paciente/{pac_id}", headers=pac)).json()
    assert sum(1 for d in dietas if d["ativo"]) == 1

    # preferir consulta: não gera dieta, mas salva respostas
    corpo["modo"] = "nutricionista"
    r = await client.post("/questionario", headers=pac, json=corpo)
    assert r.json()["recomendacao_consulta"] is True and r.json()["dieta"] is None

    # nutricionista sem vínculo não vê; com vínculo vê as respostas
    assert (await client.get(f"/pacientes/{pac_id}/questionario", headers=nut)).status_code == 403
    nut_id = (await client.get("/usuarios/me", headers=nut)).json()["id"]
    await client.post(
        "/consultas",
        headers=pac,
        json={"nutricionista_id": nut_id, "tipo_consulta": "online", "agendamento_data": "2026-12-01T10:00:00Z"},
    )
    q = (await client.get(f"/pacientes/{pac_id}/questionario", headers=nut)).json()
    assert q["modo"] == "nutricionista" and q["respostas"]["peso_kg"] == 72


def test_base_de_alimentos_consistente():
    for a in POR_ID.values():
        if "alcool" in a.etiquetas:
            continue
        # 4 kcal/g para proteína e carboidrato, 9 kcal/g para gordura: tolerância por fibras e arredondamentos
        estimado = a.proteina * 4 + a.carboidrato * 4 + a.gordura * 9
        assert abs(estimado - a.kcal) < max(0.25 * a.kcal, 5), a.id


def test_proteina_variedade_e_cafe_com_carboidrato():
    for n in (3, 4, 5, 6):
        r = respostas(refeicoes_por_dia=n, alimentos_preferidos=["banana", "frango"], restricoes=["sem_lactose"])
        metas = calcular_metas(r).metas
        refeicoes = montar_refeicoes(r, metas)
        proteina = sum(ref.total("proteina") for ref in refeicoes)
        assert abs(proteina - metas.proteina_g) / metas.proteina_g < 0.15, (n, proteina, metas.proteina_g)
        cafe = refeicoes[0]
        assert any(i.alimento.grupo == "carboidrato" for i in cafe.itens), n
        # nenhum alimento (fora azeite e vegetais) aparece em todas as refeições leves
        bananas = sum(1 for ref in refeicoes for i in ref.itens if i.alimento.id == "banana")
        assert bananas <= 2, (n, bananas)


async def test_registro_por_itens_calcula_macros(client):
    _, pac = await criar_usuario(client, "Ana Paciente", "ana@exemplo.com", "paciente")
    catalogo = (await client.get("/alimentos", headers=pac)).json()
    arroz = next(a for a in catalogo if a["id"] == "arroz_branco")
    assert arroz["medidas"] and arroz["kcal"] == 128

    r = await client.post(
        "/registros-alimentares/itens",
        headers=pac,
        json={"nome": "Almoço", "itens": [{"alimento_id": "arroz_branco", "gramas": 150}, {"alimento_id": "frango", "gramas": 100}]},
    )
    assert r.status_code == 201, r.text
    reg = r.json()
    assert reg["calorias"] == round(128 * 1.5 + 159, 1)
    assert reg["proteina_g"] == round(2.5 * 1.5 + 32.0, 1)
    assert reg["descricao"].startswith("Almoço: Arroz branco cozido (150 g)")

    assert (await client.post("/registros-alimentares/itens", headers=pac, json={"itens": [{"alimento_id": "xyz", "gramas": 10}]})).status_code == 422
    assert (await client.post("/registros-alimentares/itens", headers=pac, json={"itens": []})).status_code == 422
    # questionário continua oferecendo só alimentos do gerador
    opcoes = {a["id"] for a in (await client.get("/questionario/alimentos", headers=pac)).json()}
    assert "cerveja" not in opcoes and "frango" in opcoes


def test_semana_varia_e_mantem_metas():
    from app.services.dieta_gerador import montar_semana

    r = respostas(alimentos_preferidos=["frango", "banana"], refeicoes_por_dia=5)
    metas = calcular_metas(r).metas
    semana = montar_semana(r, metas)
    assert len(semana) == 7
    cardapios = {tuple(i.alimento.id for ref in dia for i in ref.itens) for dia in semana}
    assert len(cardapios) >= 5  # pelo menos 5 dias diferentes entre si
    for dia in semana:
        kcal = sum(ref.total("kcal") for ref in dia)
        prot = sum(ref.total("proteina") for ref in dia)
        assert abs(kcal - metas.calorias) / metas.calorias < 0.15
        assert abs(prot - metas.proteina_g) / metas.proteina_g < 0.15
    # dois dias seguidos não têm o mesmo almoço
    almocos = [tuple(i.alimento.id for i in dia[2].itens) for dia in semana]
    assert all(a != b for a, b in zip(almocos, almocos[1:]))
