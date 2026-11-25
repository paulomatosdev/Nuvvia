---
name: Nuvvia
description: Painel da nutricionista no idioma de um painel de embarque e um cartão de embarque.
colors:
  board-ground-light: "#ECEEF1"
  board-ground-dark: "#0B0F14"
  board-surface-light: "#FFFFFF"
  board-surface-dark: "#151C25"
  board-line-light: "#D5DAE1"
  board-line-dark: "#1E2631"
  ink-light: "#0B0F14"
  ink-dark: "#F5F3EE"
  muted-light: "#4B5563"
  muted-dark: "#9AA4B2"
  gate-amber: "#FFC531"
  gate-amber-ink-light: "#8A5A00"
  boarding-green-light: "#157A4A"
  boarding-green-dark: "#2BB673"
  alert-red-light: "#C9303A"
  alert-red-dark: "#F2555A"
  pass-paper: "#F5F3EE"
  pass-paper-muted: "#5F5A4E"
  pass-paper-line: "#CFC9BC"
  pass-night: "#0B0F14"
  pass-night-muted: "#A3ACB9"
  pass-night-line: "#2A3340"
typography:
  display:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "2.375rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.4375rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  row-name:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 600
    lineHeight: 1.35
  label:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "0.14em"
  data:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "1.1875rem"
    fontWeight: 700
    lineHeight: 1.35
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  pass: "14px"
  full: "9999px"
spacing:
  row-y: "14px"
  row-x: "16px"
  segment-x: "24px"
  segment-y: "20px"
  section: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ink-light}"
    textColor: "{colors.board-ground-light}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 16px"
  button-ghost:
    backgroundColor: "{colors.board-surface-light}"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 16px"
  button-boarding:
    backgroundColor: "{colors.gate-amber}"
    textColor: "{colors.pass-night}"
    rounded: "{rounded.md}"
    height: "44px"
  pill-next:
    backgroundColor: "{colors.gate-amber}"
    textColor: "{colors.pass-night}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
  input:
    backgroundColor: "{colors.board-surface-light}"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  boarding-pass:
    backgroundColor: "{colors.pass-paper}"
    textColor: "{colors.pass-night}"
    rounded: "{rounded.pass}"
    padding: "20px 24px"
---

# Design System: Nuvvia

## Overview

O Nuvvia é um painel de embarque. A agenda do dia é lida como um painel de partidas que reordena ao vivo, e cada paciente é um cartão de embarque picotado que a nutricionista vira para o paciente durante a consulta. O mundo empresta quatro coisas e só essas: a tipografia (Barlow para a interface, JetBrains Mono para horários e números), a paleta de aeroporto (painel neutro, âmbar de portão, verde de embarque, vermelho de alteração), a densidade de grade fixa de colunas e um movimento-assinatura (a linha que muda de estado se move e fica acesa; a pílula de status vira como uma palheta split-flap). Navegação, botões, abas e campos são os componentes web de sempre.

Há dois temas, claro (saguão iluminado) e escuro (portão à noite). O tema segue o sistema até a usuária escolher, e a escolha fica salva.

## Colors

### Primary
- **Âmbar de portão** (`gate-amber`): só para o que é "agora": a próxima consulta, o relógio, foco de teclado, seleção de texto, o botão de embarcar do login. Nunca decorativo. Como texto sobre o painel claro, usa `gate-amber-ink-light`.

### Secondary
- **Verde de embarque** (`boarding-green-*`): dentro da meta, confirmada, dieta ativa, dia da semana cumprido.
- **Vermelho de alteração** (`alert-red-*`): abaixo da meta, cancelada, faltou, erro.

### Neutral
- Painel: `board-ground-*`, `board-surface-*` (linha selecionada, campos), `board-line-*` (réguas de 1px), `ink-*`, `muted-*`.
- Cartão: `pass-paper*` e `pass-night*`.

### Named Rules
- **O cartão é sempre o inverso do painel.** Tema escuro: cartão em papel (`pass-paper`) sobre painel noturno. Tema claro: cartão noturno (`pass-night`) sobre painel claro. A tela é compartilhada com o paciente; o cartão precisa se destacar nos dois temas.
- **Uma cor, um significado.** Âmbar = agora; verde = dentro; vermelho = mudou ou fora. Cor de estado nunca aparece como enfeite.

## Typography

Barlow para tudo que é palavra, JetBrains Mono para tudo que é medida: horários, quantidades, percentuais, CRN, relógio. Números sempre tabulares (`font-feature-settings: "tnum"`).

### Hierarchy
- **Display** (2.375rem, 800, -0.02em): título da tela. No cartão largo, o nome do paciente sobe para 3rem.
- **Title** (1.4375rem, 700): títulos de seção.
- **Row name** (1.1875rem, 600): nome do paciente numa linha do painel.
- **Body** (0.9375rem): texto corrido e detalhes.
- **Label** (0.75rem, 600, caixa-alta, +0.14em): cabeçalhos de coluna e rótulos de campo do cartão. Nunca acima de um título de página.
- **Data** (mono, 700): horários e números.

## Layout

- Trilho lateral de 14rem a partir de 768px; abaixo disso, barra superior com ícones.
- Hoje: painel à esquerda e cartão fixo (sticky) de 25rem à direita a partir de 1280px; abaixo, o cartão desce para baixo do painel.
- Linhas do painel em grade fixa: Hora / Paciente / Tipo / Status a partir de 1024px. Abaixo disso, o tipo entra na linha de detalhe e, no celular, o status desce para baixo do nome.
- Largura máxima: 1400px (Hoje), 1200px (Pacientes, ficha), 1100px (Agenda).

## Elevation & Depth

Plano. Só o cartão de embarque tem elevação (`shadow-pass`: sombra curta de contato mais sombra difusa deslocada para baixo). Painéis são separados por réguas de 1px, não por sombra.

## Shapes

Cantos discretos: 4px (pílulas), 6px (botões, campos), 8px (contêineres do painel), 14px (cartão). O picote do cartão é uma linha tracejada com entalhes circulares de 22px nas bordas, recortados na cor do fundo.

## Components

### Buttons
Primário em tinta cheia (`ink` sobre `board-ground`); fantasma com borda de 1px; discreto só com texto. Pressionar reduz para 98%. O botão âmbar é exclusivo do login (embarcar).

### Painel de consultas (signature)
Lista de linhas em grade fixa. Em aberto primeiro, por horário; encerradas descem para o fim e ficam esmaecidas. A próxima consulta tem fundo âmbar suave e a pílula "Próxima". Ao mudar o status, a linha se move com mola sem quique e fica acesa em âmbar por 6 segundos; a pílula de status cai como uma palheta split-flap (rotateX). As ações de status aparecem ao passar o mouse ou focar; em telas de toque, ficam sempre visíveis.

### Cartão de embarque (signature)
Três segmentos separados por picote: identificação (nome, consulta, objetivo, peso, idade), hoje vs. meta (barras que se preenchem e números que contam até o valor; acima de 110% fica vermelho) e a semana (7 células: cheia = na meta, contorno vermelho = fora, tracejada = sem registro). Entra como um bilhete saindo da impressora (clip-path de cima para baixo). Na ficha do paciente, os segmentos ficam lado a lado.

### Inputs / Fields
Superfície do painel, borda de 1px, foco em âmbar. No login, os campos ficam sobre o cartão, com borda `pass-*-line`.

### Navigation
Trilho com ícones Lucide (traço 2). O item ativo tem uma placa de superfície que desliza entre os itens (layoutId). Abas da agenda com sublinhado de 2px que desliza.

## Do's and Don'ts

### Do:
- Mostrar todo número contra o que ele é medido (meta, período).
- Usar mono só para medidas e horários.
- Animar a partir de um estado já visível (opacidade inicial 0.35, não 0) e respeitar `prefers-reduced-motion`.
- Manter seleção, foco, cursor de texto e barras de rolagem no tema.

### Don't:
- Não marcar estado com faixa lateral colorida; use fundo e pílula.
- Não colocar rótulo em caixa-alta acima de títulos de página.
- Não usar anéis de progresso; o progresso é barra.
- Não usar o âmbar fora do significado "agora".
- Não usar sombras de bloco sem desfoque.
