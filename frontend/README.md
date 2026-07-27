# VittaNutricion

Interface web desenvolvida com **Next.js**, **TypeScript** e **Tailwind CSS** para gerenciamento da rotina do nutricionista. O painel centraliza consultas, pacientes, dietas e exames em uma interface moderna, intuitiva e otimizada para uso em computadores.

---

## Funcionalidades

* Autenticação integrada ao backend.
* Dashboard com visão geral da agenda e pacientes.
* Gerenciamento de consultas.
* Listagem e acompanhamento de pacientes.
* Visualização de dietas e exames.
* Estrutura preparada para integração completa com a API.

---

## Tecnologias

* Next.js
* TypeScript
* Tailwind CSS
* React
* Axios

---

## Estrutura do Projeto

```text
app/
├── login/
├── dashboard/
├── agenda/
└── pacientes/

components/
├── AppShell.tsx
├── PlateRing.tsx
├── PatientCard.tsx
├── AppointmentRow.tsx
├── StatCard.tsx
└── ui/

lib/
├── api.ts
├── mock-data.ts
└── types.ts
```

---

## Executando o Projeto

```bash
npm install
npm run dev
```

A aplicação estará disponível em:

```text
http://localhost:3000
```

Configure a URL da API criando um arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Integração com a API

O frontend já possui integração com autenticação e está preparado para consumir os principais recursos da API, incluindo usuários, consultas, dietas e exames. Atualmente, parte das telas utiliza dados simulados para desenvolvimento enquanto os endpoints correspondentes são implementados no backend.

---

## Roadmap

* Integração completa das páginas com a API.
* Gerenciamento de pacientes em tempo real.
* Cadastro e edição de dietas.
* Upload e visualização de exames.
* Estados de carregamento e tratamento de erros.
* Melhorias de responsividade e experiência do usuário.
