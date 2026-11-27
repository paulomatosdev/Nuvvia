from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from tests.conftest import criar_usuario

TODOS_OS_DIAS = [{"dia_semana": d, "hora_inicio": "08:00", "hora_fim": "20:00"} for d in range(7)]


async def preparar_nutri(client, nome, email, cidade, bairro, presencial=True, online=True):
    nut_id, nut = await criar_usuario(client, nome, email, "nutricionista")
    r = await client.put(
        "/usuarios/me/nutricionista-perfil",
        headers=nut,
        json={
            "crn": "CRN-3 1",
            "cidade": cidade,
            "bairro": bairro,
            "endereco": "Rua A, 10",
            "atende_presencial": presencial,
            "atende_online": online,
        },
    )
    assert r.status_code == 200, r.text
    r = await client.put("/usuarios/me/disponibilidade", headers=nut, json=TODOS_OS_DIAS)
    assert r.status_code == 200, r.text
    return nut_id, nut


async def test_agente_escolhe_pela_localidade_e_periodo(client):
    a_id, a = await preparar_nutri(client, "Ana Pinheiros", "ana.n@exemplo.com", "São Paulo", "Pinheiros")
    await preparar_nutri(client, "Bia Campinas", "bia.n@exemplo.com", "Campinas", "Centro", online=False)
    _, pac = await criar_usuario(client, "Paulo Paciente", "paulo.p@exemplo.com", "paciente")

    r = await client.post(
        "/agendamento/solicitar",
        headers=pac,
        json={"tipo": "tanto_faz", "periodos": ["manha"], "cidade": "sao paulo", "bairro": "pinheiros"},
    )
    assert r.status_code == 201, r.text
    res = r.json()
    c = res["consulta"]
    assert c["nutricionista_id"] == a_id
    assert c["tipo_consulta"] == "pessoal" and "Pinheiros" in c["local"]
    hora_local = datetime.fromisoformat(c["agendamento_data"].replace("Z", "+00:00")).astimezone(ZoneInfo("America/Sao_Paulo"))
    assert 8 <= hora_local.hour < 12
    assert "bairro" in res["explicacao"] and len(res["alternativas"]) == 3

    # a nutricionista foi notificada
    caixa = (await client.get("/notificacoes", headers=a)).json()
    assert caixa["nao_lidas"] == 1 and caixa["itens"][0]["tipo"] == "consulta_marcada"

    # preferências ficaram salvas e não dá para pedir outra consulta com uma pendente
    perfil = (await client.get("/usuarios/me/paciente-perfil", headers=pac)).json()
    assert perfil["cidade"] == "sao paulo" and perfil["preferencia_periodos"] == ["manha"]
    assert (await client.post("/agendamento/solicitar", headers=pac, json={})).status_code == 409


async def test_agente_prefere_online_quando_presencial_e_longe(client):
    await preparar_nutri(client, "Bia Campinas", "bia.n@exemplo.com", "Campinas", "Centro")
    _, pac = await criar_usuario(client, "Paulo Paciente", "paulo.p@exemplo.com", "paciente")
    r = await client.post("/agendamento/solicitar", headers=pac, json={"cidade": "Recife"})
    assert r.status_code == 201, r.text
    assert r.json()["consulta"]["tipo_consulta"] == "online"


async def test_sem_horario_retorna_404(client):
    nut_id, nut = await criar_usuario(client, "Sem Agenda", "sem@exemplo.com", "nutricionista")
    _, pac = await criar_usuario(client, "Paulo Paciente", "paulo.p@exemplo.com", "paciente")
    r = await client.post("/agendamento/solicitar", headers=pac, json={})
    assert r.status_code == 404


async def test_lembrete_confirmar_remarcar_e_vinculo(client):
    a_id, a = await preparar_nutri(client, "Ana Pinheiros", "ana.n@exemplo.com", "São Paulo", "Pinheiros")
    b_id, _ = await preparar_nutri(client, "Bia Outra", "bia.n@exemplo.com", "São Paulo", "Pinheiros")
    pac_id, pac = await criar_usuario(client, "Paulo Paciente", "paulo.p@exemplo.com", "paciente")

    # Consulta daqui a 20 horas (véspera ou mesmo dia): gera lembrete ao paciente
    quando = (datetime.now(timezone.utc) + timedelta(hours=20)).replace(minute=0, second=0, microsecond=0)
    r = await client.post(
        "/consultas",
        headers=a,
        json={"paciente_id": pac_id, "tipo_consulta": "online", "agendamento_data": quando.isoformat()},
    )
    consulta_id = r.json()["id"]
    caixa = (await client.get("/notificacoes", headers=pac)).json()
    lembretes = [n for n in caixa["itens"] if n["tipo"] == "lembrete_consulta"]
    assert len(lembretes) == 1 and lembretes[0]["consulta_id"] == consulta_id
    # não duplica
    caixa = (await client.get("/notificacoes", headers=pac)).json()
    assert len([n for n in caixa["itens"] if n["tipo"] == "lembrete_consulta"]) == 1

    # Remarcar: mesmo nutricionista, outro horário, lembrete fica lido
    r = await client.post(f"/agendamento/consultas/{consulta_id}/presenca", headers=pac, json={"acao": "remarcar"})
    assert r.status_code == 200, r.text
    nova = r.json()["consulta"]
    assert nova["nutricionista_id"] == a_id and nova["status"] == "agendado"
    sp = ZoneInfo("America/Sao_Paulo")
    nova_data = datetime.fromisoformat(nova["agendamento_data"].replace("Z", "+00:00")).astimezone(sp).date()
    assert nova_data != quando.astimezone(sp).date()  # remarcar vai para outro dia
    assert nova["agendamento_data"] != quando.isoformat().replace("+00:00", "Z")
    assert any(n["tipo"] == "consulta_remarcada" for n in (await client.get("/notificacoes", headers=a)).json()["itens"])

    # Confirmar
    r = await client.post(f"/agendamento/consultas/{consulta_id}/presenca", headers=pac, json={"acao": "confirmar"})
    assert r.json()["consulta"]["status"] == "confirmado"

    # Vínculo após a primeira consulta concluída
    assert (await client.get("/usuarios/me/nutricionista", headers=pac)).json() is None
    await client.patch(f"/consultas/{consulta_id}/status", headers=a, json={"status": "completado"})
    vinculo = (await client.get("/usuarios/me/nutricionista", headers=pac)).json()
    assert vinculo["id"] == a_id
    assert any(n["tipo"] == "vinculo" for n in (await client.get("/notificacoes", headers=pac)).json()["itens"])

    # Próximas consultas só com a nutricionista vinculada, mesmo havendo outra igual
    for _ in range(3):
        r = await client.post("/agendamento/solicitar", headers=pac, json={})
        assert r.json()["consulta"]["nutricionista_id"] == a_id
        cid = r.json()["consulta"]["id"]
        await client.patch(f"/consultas/{cid}/status", headers=a, json={"status": "cancelado"})
    assert b_id != a_id


async def test_disponibilidade_valida_horarios(client):
    _, nut = await criar_usuario(client, "Nina Nutri", "nina@exemplo.com", "nutricionista")
    r = await client.put(
        "/usuarios/me/disponibilidade", headers=nut, json=[{"dia_semana": 1, "hora_inicio": "12:00", "hora_fim": "08:00"}]
    )
    assert r.status_code == 422
    r = await client.put(
        "/usuarios/me/disponibilidade", headers=nut, json=[{"dia_semana": 1, "hora_inicio": "08:00", "hora_fim": "12:00"}]
    )
    assert r.json() == [{"dia_semana": 1, "hora_inicio": "08:00", "hora_fim": "12:00"}]
