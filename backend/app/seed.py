"""
Popula o banco com dados de demonstração para testar o painel.

    python -m app.seed

Cria uma nutricionista, quatro pacientes, consultas (passadas, de hoje e
futuras), dietas, exames e registros alimentares dos últimos 7 dias.
Não faz nada se a nutricionista de demonstração já existir.

Login de demonstração (somente para desenvolvimento):
    nutricionista: demo.nutri@example.com / vitta-demo-123
    pacientes:     <nome>@example.com      / vitta-demo-123
"""
import asyncio
import random
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select

from app.auth.security import hash_password
from app.database import AsyncSessionLocal
from app.models import (
    Consulta,
    DietaMeta,
    Exame,
    FonteRegistro,
    NutricionistaPerfil,
    PacientePerfil,
    PerfilAcesso,
    PlanoAlimentar,
    RegistroAlimentar,
    RotinaAlimentar,
    StatusConsulta,
    TipoConsulta,
    Usuario,
)

SENHA_DEMO = "vitta-demo-123"
EMAIL_NUTRI = "demo.nutri@example.com"

PACIENTES = [
    # nome, e-mail, objetivo, peso, altura, nascimento, metas (kcal, prot, carb, gord), disciplina
    ("Marina Souza", "marina@example.com", "Emagrecimento", 72.5, 165, date(1991, 3, 14), (1700, 110, 160, 55), 0.9),
    ("Rafael Nogueira", "rafael@example.com", "Hipertrofia", 78.0, 181, date(1996, 8, 2), (2900, 190, 320, 80), 0.4),
    ("Beatriz Lima", "beatriz@example.com", "Condição de saúde", 61.0, 158, date(1984, 11, 23), (1600, 85, 150, 50), 1.0),
    ("João Pedro Alves", "joao@example.com", None, None, None, None, None, 0.0),
]

REFEICOES_DIA = [("Café da manhã", 0.25), ("Almoço", 0.4), ("Lanche", 0.1), ("Jantar", 0.25)]


def _em(dias: int, hora: int, minuto: int = 0) -> datetime:
    agora = datetime.now(timezone.utc).astimezone()  # fuso local
    d = (agora + timedelta(days=dias)).replace(hour=hora, minute=minuto, second=0, microsecond=0)
    return d.astimezone(timezone.utc)


async def main() -> None:
    random.seed(42)
    async with AsyncSessionLocal() as db:
        if await db.scalar(select(Usuario).where(Usuario.email == EMAIL_NUTRI)):
            print("Dados de demonstração já existem. Nada a fazer.")
            return

        senha = hash_password(SENHA_DEMO)
        nutri = Usuario(
            nome_completo="Karoline Gomes",
            email=EMAIL_NUTRI,
            senha_hashed=senha,
            perfil_acesso=PerfilAcesso.NUTRICIONISTA,
            nutricionista_perfil=NutricionistaPerfil(crn="CRN-3 12345", bio="Nutrição clínica e esportiva"),
        )
        db.add(nutri)
        await db.flush()

        horarios_hoje = iter([(9, 0), (10, 30), (14, 0), (16, 0)])
        for i, (nome, email, meta, peso, altura, nasc, metas, disciplina) in enumerate(PACIENTES):
            perfil = PacientePerfil(meta=meta, peso_kg=peso, altura_cm=altura, data_nascimento=nasc)
            if metas:
                (
                    perfil.meta_diaria_calorias,
                    perfil.meta_diaria_proteina_g,
                    perfil.meta_diaria_carboidratos_g,
                    perfil.meta_diaria_gordura_g,
                ) = metas
            paciente = Usuario(
                nome_completo=nome,
                email=email,
                senha_hashed=senha,
                perfil_acesso=PerfilAcesso.PACIENTE,
                paciente_perfil=perfil,
            )
            db.add(paciente)
            await db.flush()

            tipo = TipoConsulta.ONLINE if i % 2 == 0 else TipoConsulta.PESSOAL
            local = "Rua das Palmeiras, 120 - sala 4" if tipo == TipoConsulta.PESSOAL else None
            h, m = next(horarios_hoje)
            consultas = [
                (_em(-14 - i * 3, 10), StatusConsulta.COMPLETADO),
                (_em(0, h, m), StatusConsulta.CONFIRMADO if i % 2 == 0 else StatusConsulta.AGENDADO),
                (_em(7 + i, 9 + i), StatusConsulta.AGENDADO),
            ]
            for quando, status in consultas:
                db.add(
                    Consulta(
                        paciente_id=paciente.id,
                        nutricionista_id=nutri.id,
                        tipo_consulta=tipo,
                        status=status,
                        agendamento_data=quando,
                        local=local,
                    )
                )

            if metas:
                kcal, prot, carb, gord = metas
                db.add(
                    RotinaAlimentar(
                        paciente_id=paciente.id,
                        nutricionista_id=nutri.id,
                        titulo=f"Plano — {meta.lower()}",
                        objetivo={
                            "Emagrecimento": DietaMeta.PERDER_PESO,
                            "Hipertrofia": DietaMeta.GANHO_MUSCULAR,
                        }.get(meta, DietaMeta.CONDICAO_SAUDE),
                        data_inicio=date.today() - timedelta(days=21),
                        refeicoes=[
                            PlanoAlimentar(nome="Café da manhã", horario="07:30", descricao="Ovos mexidos, pão integral e mamão", meta_calorias=kcal * 0.25),
                            PlanoAlimentar(nome="Almoço", horario="12:30", descricao="Arroz integral, feijão, frango grelhado e salada", meta_calorias=kcal * 0.4),
                            PlanoAlimentar(nome="Lanche", horario="16:00", descricao="Iogurte natural com aveia", meta_calorias=kcal * 0.1),
                            PlanoAlimentar(nome="Jantar", horario="19:30", descricao="Peixe assado com legumes", meta_calorias=kcal * 0.25),
                        ],
                    )
                )
                db.add(
                    Exame(
                        paciente_id=paciente.id,
                        enviado_por_id=nutri.id,
                        titulo="Hemograma completo",
                        data_exame=date.today() - timedelta(days=20),
                        arquivo_url="uploads/exames/exemplo.pdf",
                        notas="Sem alterações relevantes.",
                    )
                )

                # Registros dos últimos 7 dias + parte do dia de hoje
                for dias_atras in range(7, -1, -1):
                    dentro_da_meta = random.random() < disciplina
                    fator = random.uniform(0.95, 1.05) if dentro_da_meta else random.choice([0.7, 1.3])
                    refeicoes = REFEICOES_DIA[:2] if dias_atras == 0 else REFEICOES_DIA
                    for j, (nome_ref, fracao) in enumerate(refeicoes):
                        db.add(
                            RegistroAlimentar(
                                paciente_id=paciente.id,
                                fonte=FonteRegistro.MANUAL,
                                descricao=nome_ref,
                                calorias=round(kcal * fracao * fator),
                                proteina_g=round(prot * fracao * fator),
                                carboidratos_g=round(carb * fracao * fator),
                                gordura_g=round(gord * fracao * fator),
                                registro_data=datetime.now(timezone.utc).replace(hour=8 + j * 3, minute=0, second=0, microsecond=0)
                                - timedelta(days=dias_atras),
                            )
                        )

        await db.commit()
        print("Dados de demonstração criados. Veja o login no topo de app/seed.py.")


if __name__ == "__main__":
    asyncio.run(main())
