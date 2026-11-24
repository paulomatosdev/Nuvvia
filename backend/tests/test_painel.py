from datetime import datetime, timedelta, timezone

from tests.conftest import criar_usuario


async def test_painel_do_nutricionista(client):
    pac_id, pac = await criar_usuario(client, "Ana Paciente", "ana@exemplo.com", "paciente")
    _, nut = await criar_usuario(client, "Nina Nutri", "nina@exemplo.com", "nutricionista")
    _, outro = await criar_usuario(client, "Otto Nutri", "otto@exemplo.com", "nutricionista")

    await client.put("/usuarios/me/nutricionista-perfil", headers=nut, json={"crn": "CRN-3 999"})
    me = (await client.get("/usuarios/me", headers=nut)).json()
    assert me["nutricionista_perfil"]["crn"] == "CRN-3 999"

    await client.put(
        "/usuarios/me/paciente-perfil", headers=pac, json={"meta": "Emagrecimento", "meta_diaria_calorias": 1800}
    )

    # sem vínculo ainda
    assert (await client.get("/pacientes", headers=nut)).json() == []

    # nutricionista agenda para o paciente
    amanha = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    r = await client.post(
        "/consultas",
        headers=nut,
        json={"paciente_id": pac_id, "tipo_consulta": "online", "agendamento_data": amanha},
    )
    assert r.status_code == 201, r.text
    assert r.json()["paciente"]["nome_completo"] == "Ana Paciente"

    r = await client.post(
        "/consultas", headers=nut, json={"tipo_consulta": "online", "agendamento_data": amanha}
    )
    assert r.status_code == 400  # faltou o paciente

    await client.post(
        "/registros-alimentares/manual",
        headers=pac,
        json={"descricao": "Almoço", "calorias": 700, "proteina_g": 40, "carboidratos_g": 60, "gordura_g": 20},
    )

    lista = (await client.get("/pacientes", headers=nut)).json()
    assert len(lista) == 1
    p = lista[0]
    assert p["nome_completo"] == "Ana Paciente"
    assert p["meta"] == "Emagrecimento"
    assert p["macros_hoje"]["calorias_consumidas"] == 700
    assert p["macros_hoje"]["meta_calorias"] == 1800
    assert p["adesao_7d"] == 0
    assert len(p["semana"]) == 7 and p["semana"][-1]["na_meta"] is False
    assert p["proxima_consulta"] is not None

    assert (await client.get(f"/pacientes/{pac_id}", headers=nut)).status_code == 200
    assert (await client.get(f"/pacientes/{pac_id}", headers=outro)).status_code == 403
    assert (await client.get("/pacientes", headers=pac)).status_code == 403


async def test_datas_sempre_em_utc(client):
    pac_id, _ = await criar_usuario(client, "Ana Paciente", "ana@exemplo.com", "paciente")
    _, nut = await criar_usuario(client, "Nina Nutri", "nina@exemplo.com", "nutricionista")

    # 15:30 em Brasília (-03:00) precisa voltar como 18:30 UTC, com fuso explícito
    r = await client.post(
        "/consultas",
        headers=nut,
        json={"paciente_id": pac_id, "tipo_consulta": "online", "agendamento_data": "2026-12-10T15:30:00-03:00"},
    )
    assert r.status_code == 201, r.text
    lida = (await client.get("/consultas/minhas", headers=nut)).json()[0]
    assert lida["agendamento_data"] == "2026-12-10T18:30:00Z"
