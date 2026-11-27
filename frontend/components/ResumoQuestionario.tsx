"use client";

import { api } from "@/lib/api";
import { dataCurta } from "@/lib/format";
import { ATIVIDADES, CONDICOES, OBJETIVOS, RESTRICOES, TEMPOS, rotuloDe } from "@/lib/questionario";
import { useApi } from "@/lib/useApi";
import { Estado } from "./Estado";

/** Respostas do questionário alimentar do paciente, para a nutricionista. */
export function ResumoQuestionario({ pacienteId }: { pacienteId: string }) {
  const q = useApi(() => api.questionarioDoPaciente(pacienteId), [pacienteId]);
  const alimentos = useApi(api.alimentosDoQuestionario);
  const nomes = new Map((alimentos.data ?? []).map((a) => [a.id, a.nome]));
  const r = q.data?.respostas;

  const lista = (ids: string[]) => (ids.length ? ids.map((id) => nomes.get(id) ?? id).join(", ") : "—");

  return (
    <section aria-labelledby="questionario">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="questionario" className="text-xl font-bold text-ink">
          Questionário alimentar
        </h2>
        {q.data && (
          <p className="text-sm text-muted">
            Respondido em {dataCurta(q.data.criacao_data)} ·{" "}
            {q.data.modo === "nutricionista" ? "pediu consulta com nutricionista" : "gerou dieta pelo app"}
          </p>
        )}
      </div>
      <div className="mt-3 rounded-lg border border-line">
        <Estado
          loading={q.loading}
          error={q.error}
          onRetry={q.reload}
          linhas={2}
          vazio={!r}
          mensagemVazio="O paciente ainda não respondeu o questionário."
        >
          {r && (
            <dl className="grid gap-x-6 gap-y-4 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Objetivo", rotuloDe(OBJETIVOS, r.objetivo)],
                ["Atividade", rotuloDe(ATIVIDADES, r.nivel_atividade)],
                ["Refeições por dia", String(r.refeicoes_por_dia)],
                ["Tempo para cozinhar", rotuloDe(TEMPOS, r.tempo_cozinhar)],
                ["Restrições", r.restricoes.length ? r.restricoes.map((x) => rotuloDe(RESTRICOES, x)).join(", ") : "Nenhuma"],
                [
                  "Condições de saúde",
                  r.condicoes_saude.length ? r.condicoes_saude.map((x) => rotuloDe(CONDICOES, x)).join(", ") : "Nenhuma",
                ],
                ["Alergias", r.alergias || "Nenhuma"],
                ["Gosta de", lista(r.alimentos_preferidos)],
                ["Não come", lista(r.alimentos_evitados)],
              ].map(([rotulo, valor]) => (
                <div key={rotulo} className="min-w-0">
                  <dt className="rotulo text-muted">{rotulo}</dt>
                  <dd className="mt-0.5 text-base text-ink">{valor}</dd>
                </div>
              ))}
            </dl>
          )}
        </Estado>
      </div>
    </section>
  );
}
