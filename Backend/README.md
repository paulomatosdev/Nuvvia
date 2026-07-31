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
├── models/              # tabelas do banco de dados (SQLAlchemy ORM)
│   ├── user.py          # User, PatientProfile, NutritionistProfile
│   ├── appointment.py   # Appointment (consultas)
│   ├── exam.py          # Exam (exames)
│   ├── diet.py          # DietPlan, PlannedMeal (dietas)
│   └── meal_log.py      # MealLog (diário de refeições/macros)
├── schemas/             # validação de entrada/saída da API (Pydantic)
├── routers/             # endpoints da API, um arquivo por módulo
├── auth/                # segurança: hash de senha, JWT, dependências
└── services/
    └── ai_macro_service.py  # placeholder para estimativa de macros via foto
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

3. Ter um PostgreSQL rodando e criar o banco `nutricao_db` ou o nome
   definido em `DATABASE_URL`.

4. Executar o servidor:
   ```bash
   uvicorn app.main:app --reload
   ```

5. Acessar a documentação interativa em `http://localhost:8000/docs`.

## Endpoints principais implementados

- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me`
- `PUT /users/me/patient-profile`
- `POST /appointments`
- `GET /appointments/mine`
- `PATCH /appointments/{appointment_id}/status`
- `POST /exams`
- `GET /exams/patient/{patient_id}`
- `POST /diets`
- `GET /diets/patient/{patient_id}`
- `POST /meal-logs/photo`
- `POST /meal-logs/manual`
- `GET /meal-logs/today`
- `GET /meal-logs/summary/today`

## Módulos implementados

- **Autenticação** (`/auth`): registro e login com JWT, com distinção de
  papeis entre paciente e nutricionista.
- **Usuários** (`/users`): recuperação do próprio perfil e atualização de
  perfil de paciente.
- **Consultas** (`/appointments`): criação de agendamento pelo paciente,
  listagem de consultas do usuário logado e atualização de status pelo
  nutricionista.
- **Exames** (`/exams`): upload de arquivo com metadados e listagem de
  exames por paciente.
- **Dietas** (`/diets`): criação de plano pelo nutricionista e listagem
  por paciente.
- **Diário de refeições** (`/meal-logs`): lançamentos manuais e por foto,
  além de listagem diária e resumo macro.

## Observações importantes

- O backend não expõe um endpoint `/patients` atualmente.
- O upload de exames e fotos grava arquivos localmente sob o diretório
  configurado em `UPLOAD_DIR`.
- `services/ai_macro_service.py` ainda é um placeholder para o cálculo de
  macros a partir de imagem.
- `ALLOWED_ORIGINS` pode ser ajustado no `.env` para liberar o frontend.

## Próximos passos sugeridos

1. Configurar Alembic para migrações do banco.
2. Implementar de fato o `ai_macro_service.py` para estimativa de macros.
3. Adicionar testes automatizados com `pytest` e `httpx`.
4. Validar uploads com tamanho, tipo de arquivo e rate limiting.
5. Integrar videochamada real para consultas online.
