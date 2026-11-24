---
version: 1
slug: "frontend-app-dashboard-page-tsx"
primary_target: "frontend/app/dashboard/page.tsx"
related_targets: ["frontend/app/agenda/page.tsx","frontend/app/pacientes/page.tsx","frontend/app/pacientes/[id]/page.tsx","frontend/app/login/page.tsx"]
---

# Painel da nutricionista (todas as telas autenticadas + login)

Mode: Operate. Tela compartilhada com o paciente durante a consulta; desktop/notebook. Tarefas: ver o dia, abrir o próximo paciente, discutir macros/adesão/dieta/exames, mudar status da consulta, agendar.

## Direction contract

THESIS: A agenda é um painel de embarque que reordena ao vivo, e cada paciente é um cartão de embarque picotado. Recusa o padrão da categoria: cartões brancos de KPI com anéis de progresso e ícones lineares.

OWN-WORLD: Fundo de painel quase preto (#0B0F14) no escuro e papel de cartão (#F5F3EE) no claro; âmbar de portão (#FFC531) só para "próxima"/foco; verde de embarque (#2BB673) para dentro da meta/concluída; vermelho de alerta (#E5484D) para mudança, falta, abaixo da meta. Barlow para UI, JetBrains Mono para horas, números e códigos. Cartão com segmentos separados por picote tracejado e entalhes circulares nas bordas. Linhas do painel em grade fixa de colunas, réguas de 1px.

STORY: A nutricionista bate o olho no painel e sabe quem embarca agora; abre o cartão e mostra ao paciente o dia e a semana dele contra a meta; muda um status e vê a linha se mover e ficar acesa.

FIRST VIEWPORT: Trilho lateral estreito (logo, Hoje/Agenda/Pacientes, usuária, alternador de tema). Centro: título "Consultas de hoje" com relógio mono âmbar; painel de colunas Hora/Paciente/Tipo/Status; próxima consulta com faixa âmbar à esquerda; concluídas esmaecidas; alerta vermelho de adesão baixa. Direita (≥1280px): cartão de embarque do paciente da próxima consulta com segmentos picotados: identificação, hoje vs meta (barras), semana de adesão como bloco de 7 células.

FORM: Painel de embarque + cartão de embarque (vernacular-ephemera-boarding-pass-and-gate-board), challenger vencedor da mão ousada (posição 1 do re-roll em verdict "wins"). seed:e4205946c92d0079. Assinatura: linha que muda de status anima a reordenação no lugar (layout animation preservando identidade) e fica acesa até ser notada; números do cartão contam até o valor; picote do cartão "destaca" na entrada. Motion grammar: entradas em cascata curta (≤ 40ms entre linhas), springs sem quique para layout, tudo desativado/instantâneo com prefers-reduced-motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Adaptations: (1) o cartão de embarque é sempre o inverso do painel (escuro no tema claro, claro no escuro), porque a tela é compartilhada com o paciente e o cartão precisa contrastar com o painel nos dois temas (PRODUCT.md, Operating Context). (2) A "próxima" consulta é marcada por fundo âmbar suave e pílula "Próxima", não por faixa lateral, porque bordas laterais coloridas acima de 1px estão vetadas pelo piso de qualidade. (3) Split-flap: a pílula de status troca com uma palheta que gira em X.

Unresolved: cadastro de paciente pelo painel não existe; o painel não inventa essa ação.
