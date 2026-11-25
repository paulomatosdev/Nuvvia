# Nuvvia — Painel da nutricionista (frontend web)

Frontend web em **Next.js + TypeScript + Tailwind** para o painel do
nutricionista. O projeto está orientado para desktop/PC — o paciente
usa o app mobile.

## Identidade visual

- **Paleta**: fundo branco-sálvia, verde-floresta como cor de marca e
tres cores de dados para os macros — ameixa (proteína), mostarda
(carboidrato) e verde-azulado (gordura).
- **Tipografia**: Fraunces para títulos e IBM Plex Sans para texto e dados.
- **Elemento de assinatura**: o anel de prato (`components/PlateRing.tsx`),
um componente visual que representa o progresso dos macros do dia.

## Estrutura

```
app/
├── login/page.tsx           # tela de login
├── dashboard/page.tsx        # visão geral: agenda do dia + pacientes que precisam de atenção
├── agenda/page.tsx           # lista de consultas agrupadas por dia
└── pacientes/
    ├── page.tsx               # lista de pacientes (mock)
    └── [id]/page.tsx           # detalhe do paciente (mock)

components/
├── AppShell.tsx        # navegação lateral + estrutura das páginas internas
├── PlateRing.tsx       # elemento de assinatura (anel de macros)
├── PatientCard.tsx
├── AppointmentRow.tsx
├── StatCard.tsx
└── ui/Button.tsx

lib/
├── api.ts              # cliente HTTP para o backend FastAPI
├── types.ts
└── mock-data.ts        # dados de exemplo para front-end funcionar sem backend
```

## Como rodar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

Por padrão o frontend usa `http://localhost:8000` como backend. Para
alterar, crie um arquivo `.env.local` com:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

O Next.js carrega automaticamente `.env.local` durante o desenvolvimento.

## Integração com backend

O cliente de API em `lib/api.ts` expõe chamadas para:

- `POST /auth/login`
- `GET /users/me`
- `GET /appointments/mine`
- `GET /exams/patient/{patientId}`
- `GET /diets/patient/{patientId}`

No estado atual do projeto:

- O login está integrado ao backend e salva o token em `localStorage`.
- As páginas de pacientes, agenda e detalhamento ainda usam dados
  mock de `lib/mock-data.ts`.
- O backend ainda não expõe uma rota `/patients`, por isso a lista de
  pacientes ainda não está conectada a dados reais.

## O que já está implementado

- Login com backend via `/auth/login`.
- Dashboard com estatísticas e agenda do dia usando dados mock.
- Agenda por data com layout pronto.
- Lista de pacientes e detalhe de paciente com dados de exemplo.

## Próximos passos sugeridos

1. Implementar o endpoint de pacientes no backend e substituir o mock
   dos pacientes por dados reais.
2. Buscar dados reais de consultas e dietas nas páginas de agenda e
   paciente.
3. Adicionar estados de carregamento e de erro nas requisições.
4. Ajustar responsividade para telas médias e desktop pequenos.
5. Criar telas de criação/edição de dieta e upload/visualização de exames.
