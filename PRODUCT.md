# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Nutricionistas clínicas que atendem pacientes de forma recorrente (presencial e online). O uso principal do painel acontece **durante a consulta**: a tela fica aberta diante do paciente, e a nutricionista mostra metas, consumo e evolução junto com ele. Também usam o painel para conferir a agenda do dia e revisar um paciente antes de atendê-lo.

Pacientes não usam o painel; eles registram refeições e agendam pelo aplicativo (fora do escopo deste frontend). O painel recusa contas de paciente.

## Product Purpose

O Vitta conecta o consultório ao dia a dia do paciente. A nutricionista agenda consultas, monta rotinas alimentares e guarda exames, e enxerga entre uma consulta e outra o que o paciente de fato comeu, comparado com a meta. Sucesso é a consulta virar uma conversa sobre dados reais da semana, não sobre memória.

## Positioning

Gestão do consultório e acompanhamento diário pesam igual. O mecanismo que diferencia: o paciente registra refeições (manualmente ou por foto com estimativa de macros por IA), e o painel transforma isso em macros do dia versus meta e em adesão semanal (dias dentro de ±10% da meta calórica nos últimos 7 dias).

## Operating Context

- Tela compartilhada com o paciente durante a consulta: o que aparece precisa ser legível à distância de uma mesa e apresentável, sem dados de outros pacientes em destaque na tela de detalhe.
- Desktop ou notebook no consultório; consultas online por videochamada.
- Fluxo típico: abrir o dia → ver próxima consulta → abrir o paciente → discutir macros, adesão, dieta e exames → registrar status da consulta.

## Capabilities and Constraints

- Frontend Next.js 14 (App Router, componentes de cliente) + Tailwind 3, consumindo a API FastAPI do diretório `backend/`.
- Telas: login, visão geral (dashboard), agenda (próximas/anteriores, mudar status, nova consulta), lista de pacientes com busca, detalhe do paciente (ficha, macros de hoje, dietas, exames).
- Dados disponíveis por paciente: objetivo, peso, altura, nascimento, última e próxima consulta, macros de hoje (calorias, proteína, carboidrato, gordura) com metas, adesão em 7 dias.
- Status de consulta: agendada, confirmada, concluída, cancelada, faltou. Tipos: presencial, online.
- A estimativa de macros por foto ainda é um placeholder no backend.
- O "dia" é contado em UTC no backend (pendência conhecida).
- Não existe ainda: cadastro/convite de paciente pelo painel, upload de exame pelo painel, edição de dieta pelo painel.

## Brand Commitments

- Nome do produto: **Vitta**. Nada além do nome é compromisso: paleta, tipografia e metáforas visuais anteriores podem ser substituídas.
- Idioma da interface: português do Brasil.

## Evidence on Hand

- Dados de demonstração gerados por `backend/app/seed.py` (sintéticos).
- Não há logotipo, fotografia, depoimentos, clientes ou métricas reais. Nada disso deve ser inventado.

## Product Principles

1. A tela é apresentada ao paciente: clareza e calma acima de densidade.
2. Dados reais da semana valem mais que o registro do dia da consulta.
3. Agenda e acompanhamento são partes de um mesmo fluxo, não módulos separados.
4. Nunca mostrar um número sem dizer contra o quê ele é medido (meta, período).

## Accessibility & Inclusion

Tema claro e escuro. Respeitar `prefers-reduced-motion`. Contraste legível à distância (tela compartilhada na mesa).
