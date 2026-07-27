# Sistema de Nutrição e Saúde — Backend

API REST desenvolvida com **FastAPI** para uma plataforma de gestão nutricional, permitindo o gerenciamento de pacientes, nutricionistas, consultas, planos alimentares, exames e diário alimentar em um único sistema.

A aplicação foi construída utilizando arquitetura modular, autenticação JWT, SQLAlchemy e PostgreSQL, seguindo boas práticas de desenvolvimento para oferecer uma base escalável, segura e preparada para ambientes de produção.

## Recursos

* Autenticação e autorização com JWT.
* Cadastro de pacientes e nutricionistas.
* Agendamento e gerenciamento de consultas.
* Criação de planos alimentares personalizados.
* Upload e gerenciamento de exames.
* Diário alimentar com registros manuais e por imagem.
* Resumo diário de calorias e macronutrientes.
* Estrutura preparada para integração com Inteligência Artificial.

## Tecnologias

* Python 3.12+
* FastAPI
* SQLAlchemy
* PostgreSQL
* Pydantic
* JWT

## Estrutura do Projeto

```text
app/
├── auth/
├── models/
├── routers/
├── schemas/
├── services/
├── config.py
├── database.py
└── main.py
```

## Executando o Projeto

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Após iniciar a aplicação, a documentação estará disponível em:

```text
http://localhost:8000/docs
```

## Roadmap

* Integração com IA para reconhecimento de alimentos.
* Migrações com Alembic.
* Testes automatizados.
* Docker e Docker Compose.
* CI/CD com GitHub Actions.
* Cache com Redis.
* Deploy em ambiente cloud.
