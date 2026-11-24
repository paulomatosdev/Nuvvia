from tests.conftest import criar_usuario


async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200


async def test_login_invalido(client):
    await criar_usuario(client, "Ana Paciente", "ana@exemplo.com", "paciente")
    r = await client.post("/auth/login", json={"email": "ana@exemplo.com", "senha": "errada"})
    assert r.status_code == 401


async def test_nao_permite_cadastro_admin(client):
    r = await client.post(
        "/auth/registrar",
        json={"nome_completo": "Xavier", "email": "x@exemplo.com", "senha": "senha-forte-123", "perfil_acesso": "admin"},
    )
    assert r.status_code == 403


async def test_fluxo_completo(client):
    pac_id, pac = await criar_usuario(client, "Ana Paciente", "ana@exemplo.com", "paciente")
    nut_id, nut = await criar_usuario(client, "Nina Nutri", "nina@exemplo.com", "nutricionista")
    _, outro_nut = await criar_usuario(client, "Otto Nutri", "otto@exemplo.com", "nutricionista")

    # perfis
    r = await client.put("/usuarios/me/paciente-perfil", headers=pac, json={"peso_kg": 70, "meta_diaria_calorias": 1800})
    assert r.status_code == 200, r.text
    assert r.json()["peso_kg"] == 70
    r = await client.put("/usuarios/me/nutricionista-perfil", headers=nut, json={"crn": "CRN-3 12345"})
    assert r.status_code == 200, r.text

    # sem vínculo, nutricionista não vê o paciente
    r = await client.get(f"/exames/paciente/{pac_id}", headers=nut)
    assert r.status_code == 403

    # consulta
    r = await client.post(
        "/consultas",
        headers=pac,
        json={"nutricionista_id": nut_id, "tipo_consulta": "online", "agendamento_data": "2026-12-01T10:00:00Z"},
    )
    assert r.status_code == 201, r.text
    consulta_id = r.json()["id"]
    r = await client.post(
        "/consultas",
        headers=pac,
        json={"nutricionista_id": nut_id, "tipo_consulta": "pessoal", "agendamento_data": "2026-12-01T10:00:00Z"},
    )
    assert r.status_code == 400  # presencial sem local
    r = await client.patch(f"/consultas/{consulta_id}/status", headers=nut, json={"status": "confirmado"})
    assert r.json()["status"] == "confirmado"
    assert len((await client.get("/consultas/minhas", headers=pac)).json()) == 1

    # agora há vínculo
    r = await client.get("/usuarios/meus-pacientes", headers=nut)
    assert [p["id"] for p in r.json()] == [pac_id]
    assert (await client.get(f"/exames/paciente/{pac_id}", headers=nut)).status_code == 200
    assert (await client.get(f"/exames/paciente/{pac_id}", headers=outro_nut)).status_code == 403

    # dieta
    r = await client.post(
        "/dietas",
        headers=nut,
        json={
            "paciente_id": pac_id,
            "titulo": "Plano dezembro",
            "objetivo": "perder_peso",
            "data_inicio": "2026-12-01",
            "refeicoes": [{"nome": "Café da manhã", "horario": "07:30", "descricao": "Ovos e frutas", "meta_calorias": 400}],
        },
    )
    assert r.status_code == 201, r.text
    r = await client.get(f"/dietas/paciente/{pac_id}", headers=pac)
    assert r.json()[0]["refeicoes"][0]["nome"] == "Café da manhã"

    # exame (upload)
    r = await client.post(
        "/exames",
        headers=nut,
        data={"paciente_id": pac_id, "titulo": "Hemograma", "data_exame": "2026-11-20"},
        files={"arquivo": ("../../malicioso.pdf", b"%PDF-1.4 teste", "application/pdf")},
    )
    assert r.status_code == 201, r.text
    assert "malicioso" not in r.json()["arquivo_url"]
    r = await client.post(
        "/exames",
        headers=nut,
        data={"paciente_id": pac_id, "titulo": "X", "data_exame": "2026-11-20"},
        files={"arquivo": ("script.exe", b"MZ", "application/octet-stream")},
    )
    assert r.status_code == 400

    # diário de refeições
    r = await client.post(
        "/registros-alimentares/manual",
        headers=pac,
        json={"descricao": "Almoço", "calorias": 600, "proteina_g": 40, "carboidratos_g": 60, "gordura_g": 20},
    )
    assert r.status_code == 201, r.text
    r = await client.post(
        "/registros-alimentares/foto", headers=pac, files={"arquivo": ("prato.jpg", b"\xff\xd8fake", "image/jpeg")}
    )
    assert r.status_code == 201, r.text
    r = await client.get("/registros-alimentares/resumo/hoje", headers=pac)
    assert r.status_code == 200, r.text
    assert r.json()["calorias_consumidas"] == 600
    assert r.json()["meta_calorias"] == 1800
