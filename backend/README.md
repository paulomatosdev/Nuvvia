# Sistema de Nutrição e Saúde — Backend

API em **FastAPI** para o sistema de nutrição: agendamento de consultas
(presencial/online), exames, dietas personalizadas e diário de macros com
estimativa por foto via IA.

## Estrutura do projeto

```
app/
├── main.py              # ponto de entrada, monta o app e as rotas
├── config.py            # configurações (lidas de variáveis de ambiente)
├── database.py          # conexão async com o banco (SQLAlchemy)
├── models/              # tabelas do banco (SQLAlchemy ORM)
│   ├── usuario.py       # Usuario, PacientePerfil, NutricionistaPerfil
│   ├── consulta.py      # Consulta
│   ├── exame.py         # Exame
│   ├── dieta.py         # RotinaAlimentar, PlanoAlimentar
│   └── registro_alimentar.py  # RegistroAlimentar (diário de macros)
├── schemas/             # validação de entrada/saída da API (Pydantic)
├── routers/             # endpoints da API, um arquivo por módulo
├── auth/                # hash de senha, JWT, controle de acesso
└── services/
    ├── uploads.py           # gravação segura de arquivos enviados
    └── ai_macro_service.py  # placeholder para estimativa de macros via foto
alembic/                 # migrações do banco
tests/                   # testes de ponta a ponta (SQLite em memória)
```

## Como rodar localmente

1. Criar ambiente virtual e instalar dependências:
   ```bash
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Copiar `.env.example` para `.env` e ajustar os valores, especialmente:
   - `DATABASE_URL`
   - `SECRET_KEY`

   O arquivo `.env.example` já contém todas as variáveis esperadas pelo
   aplicativo. Não é necessário instalar nenhum pacote extra para ler
   esse arquivo, pois o `pydantic-settings` carrega `.env` automaticamente.

   Exemplo mínimo de `.env`:

   ```env
   ENVIRONMENT=development
   DEBUG=true
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/nutricao_db
   SECRET_KEY=troque-isso-por-uma-chave-secreta-forte
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   UPLOAD_DIR=./uploads
   MAX_UPLOAD_SIZE_MB=10
   AI_PROVIDER_API_KEY=
   AI_PROVIDER_BASE_URL=https://api.anthropic.com/v1
   ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:8080"]
   ```

3. Ter um PostgreSQL rodando, criar o banco `nutricao_db` (ou o nome
   definido em `DATABASE_URL`) e aplicar as migrações:
   ```bash
   alembic upgrade head
   ```
   Depois de alterar um modelo, gere uma nova migração com
   `alembic revision --autogenerate -m "descricao"`.

4. Executar o servidor:
   ```bash
   uvicorn app.main:app --reload
   ```

5. Acessar a documentação interativa em `http://localhost:8000/docs`
   (o botão "Authorize" aceita e-mail e senha).

## Dados de demonstração

Para testar o painel com dados de exemplo (nutricionista, pacientes,
consultas, dietas e registros dos últimos 7 dias):

```bash
python -m app.seed
```

O login de demonstração está no topo de `app/seed.py`. Para testar sem
PostgreSQL, use `DATABASE_URL=sqlite+aiosqlite:///./dev.db` (requer
`requirements-dev.txt`) e rode `alembic upgrade head` antes do seed.

## Testes

```bash
pip install -r requirements-dev.txt
pytest
```

Os testes usam SQLite em memória, então não precisam do PostgreSQL.

## Endpoints

| Módulo | Rotas |
|---|---|
| Autenticação | `POST /auth/registrar`, `POST /auth/login` |
| Pacientes (painel) | `GET /pacientes`, `GET /pacientes/{paciente_id}` — dados, macros de hoje e adesão em 7 dias |
| Usuários | `GET /usuarios/me`, `GET/PUT /usuarios/me/paciente-perfil`, `PUT /usuarios/me/nutricionista-perfil`, `GET /usuarios/nutricionistas`, `GET /usuarios/meus-pacientes` |
| Consultas | `POST /consultas` (paciente ou nutricionista), `GET /consultas/minhas`, `PATCH /consultas/{consulta_id}/status` |
| Exames | `POST /exames` (multipart), `GET /exames/paciente/{paciente_id}` |
| Dietas | `POST /dietas`, `GET /dietas/paciente/{paciente_id}` |
| Diário de refeições | `POST /registros-alimentares/foto`, `POST /registros-alimentares/manual`, `GET /registros-alimentares/hoje`, `GET /registros-alimentares/resumo/hoje` |

### Regras de acesso

- Paciente só vê os próprios dados.
- Nutricionista só vê pacientes com quem tem consulta ou rotina alimentar.
- Admin vê tudo (não pode ser criado pelo cadastro público).

## Observações importantes

- O upload de exames e fotos grava arquivos localmente sob o diretório
  configurado em `UPLOAD_DIR`.
- `services/ai_macro_service.py` ainda é um placeholder para o cálculo de
  macros a partir de imagem.
- `ALLOWED_ORIGINS` pode ser ajustado no `.env` para liberar o frontend.

## Próximos passos sugeridos

1. Implementar de fato o `ai_macro_service.py` para estimativa de macros.
2. Rate limiting no login e nos uploads.
3. Considerar o fuso horário do paciente no resumo diário (hoje usa UTC).
4. Integrar videochamada real para consultas online.
