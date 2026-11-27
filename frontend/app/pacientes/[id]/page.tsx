"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CartaoEmbarque } from "@/components/CartaoEmbarque";
import { Estado } from "@/components/Estado";
import { ResumoQuestionario } from "@/components/ResumoQuestionario";
import { DietaPlano } from "@/components/DietaPlano";
import { cascata } from "@/components/motion";
import { api } from "@/lib/api";
import { dataCurta, numero } from "@/lib/format";
import { DietaMeta } from "@/lib/types";
import { useApi } from "@/lib/useApi";

const OBJETIVO_LABEL: Record<DietaMeta, string> = {
  perder_peso: "Perder peso",
  ganho_muscular: "Ganho muscular",
  manutencao: "Manutenção",
  condicao_saude: "Condição de saúde",
};

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <DetalhePaciente id={params.id} />
    </AppShell>
  );
}

function Voltar() {
  return (
    <Link
      href="/pacientes"
      className="group inline-flex items-center gap-1.5 text-base font-semibold text-muted transition-colors hover:text-ink"
    >
      <ArrowLeft className="size-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" aria-hidden />
      Pacientes
    </Link>
  );
}

function DetalhePaciente({ id }: { id: string }) {
  const paciente = useApi(() => api.paciente(id), [id]);
  const dietas = useApi(() => api.dietasDoPaciente(id), [id]);
  const exames = useApi(() => api.examesDoPaciente(id), [id]);

  return (
    <div className="mx-auto max-w-[1200px]">
      <Voltar />

      <div className="mt-5">
        {paciente.data ? (
          <CartaoEmbarque paciente={paciente.data} largo />
        ) : (
          <div className="rounded-[14px] border border-line">
            <Estado loading={paciente.loading} error={paciente.error} onRetry={paciente.reload} linhas={3}>
              {null}
            </Estado>
          </div>
        )}
      </div>

      {paciente.data && (
        <p className="mt-4 font-mono text-sm text-muted">
          {paciente.data.email}
          {paciente.data.altura_cm ? ` · ${numero(paciente.data.altura_cm)} cm` : ""}
          {paciente.data.ultima_consulta ? ` · última consulta ${dataCurta(paciente.data.ultima_consulta)}` : ""}
        </p>
      )}

      <div className="mt-10">
        <ResumoQuestionario pacienteId={id} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="dietas">
          <h2 id="dietas" className="text-xl font-bold text-ink">
            Dietas
          </h2>
          <div className="mt-3">
            <Estado
              loading={dietas.loading}
              error={dietas.error}
              onRetry={dietas.reload}
              linhas={2}
              vazio={(dietas.data ?? []).length === 0}
              mensagemVazio="Nenhuma dieta cadastrada."
            >
              <motion.div variants={cascata.container} initial="hidden" animate="show" className="space-y-6">
                {(dietas.data ?? []).map((d) => (
                  <motion.article key={d.id} variants={cascata.item} className="rounded-lg border border-line">
                    <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-4 py-3">
                      <h3 className="text-lg font-bold text-ink">{d.titulo}</h3>
                      <span className="flex items-center gap-2 text-sm text-muted">
                        {d.ativo && (
                          <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.1em] text-ok">
                            <span className="size-1.5 rounded-full bg-ok" aria-hidden />
                            Ativa
                          </span>
                        )}
                        {OBJETIVO_LABEL[d.objetivo]} · desde {dataCurta(d.data_inicio)}
                        {d.origem === "app" && " · gerada pelo app"}
                      </span>
                    </header>
                    {d.refeicoes.length > 0 && <DietaPlano dieta={d} />}
                  </motion.article>
                ))}
              </motion.div>
            </Estado>
          </div>
        </section>

        <section aria-labelledby="exames">
          <h2 id="exames" className="text-xl font-bold text-ink">
            Exames
          </h2>
          <div className="mt-3">
            <Estado
              loading={exames.loading}
              error={exames.error}
              onRetry={exames.reload}
              linhas={2}
              vazio={(exames.data ?? []).length === 0}
              mensagemVazio="Nenhum exame enviado."
            >
              <motion.ul
                variants={cascata.container}
                initial="hidden"
                animate="show"
                className="divide-y divide-line rounded-lg border border-line"
              >
                {(exames.data ?? []).map((e) => (
                  <motion.li key={e.id} variants={cascata.item} className="flex gap-3 px-4 py-3">
                    <FileText className="mt-0.5 size-5 shrink-0 text-muted" strokeWidth={1.75} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-base font-semibold text-ink">{e.titulo}</p>
                        <p className="shrink-0 font-mono text-sm text-muted">{dataCurta(e.data_exame)}</p>
                      </div>
                      {e.notas && <p className="mt-0.5 text-sm text-muted">{e.notas}</p>}
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            </Estado>
          </div>
        </section>
      </div>
    </div>
  );
}
