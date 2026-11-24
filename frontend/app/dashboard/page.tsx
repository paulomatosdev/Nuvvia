"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { AppShell, useUsuario } from "@/components/AppShell";
import { CartaoEmbarque } from "@/components/CartaoEmbarque";
import { Estado } from "@/components/Estado";
import { cascata, EASE_OUT } from "@/components/motion";
import { estaEncerrada, PainelConsultas, proximaConsulta } from "@/components/PainelConsultas";
import { Relogio } from "@/components/Relogio";
import { api } from "@/lib/api";
import { dataPorExtenso, isHoje, primeiroNome, saudacao } from "@/lib/format";
import { Consulta } from "@/lib/types";
import { useApi } from "@/lib/useApi";

/** Abaixo desta adesão semanal (%), o paciente aparece em "Precisam de atenção". */
const LIMITE_ATENCAO = 80;

export default function DashboardPage() {
  return (
    <AppShell>
      <Hoje />
    </AppShell>
  );
}

function Hoje() {
  const usuario = useUsuario();
  const consultas = useApi(api.minhasConsultas);
  const pacientes = useApi(api.pacientes);
  const [atualizadas, setAtualizadas] = useState<Record<string, Consulta>>({});
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);

  const deHoje = (consultas.data ?? []).map((c) => atualizadas[c.id] ?? c).filter((c) => isHoje(c.agendamento_data));
  const proxima = proximaConsulta(deHoje);
  const selecionada = deHoje.find((c) => c.id === selecionadaId) ?? proxima ?? deHoje[0] ?? null;
  const pacienteDoCartao = (pacientes.data ?? []).find((p) => p.id === selecionada?.paciente_id) ?? null;

  const encerradas = deHoje.filter(estaEncerrada).length;
  const comAdesao = (pacientes.data ?? []).filter((p) => p.adesao_7d !== null);
  const adesaoMedia = comAdesao.length
    ? Math.round(comAdesao.reduce((acc, p) => acc + (p.adesao_7d ?? 0), 0) / comAdesao.length)
    : null;
  const atencao = comAdesao
    .filter((p) => (p.adesao_7d ?? 0) < LIMITE_ATENCAO)
    .sort((a, b) => (a.adesao_7d ?? 0) - (b.adesao_7d ?? 0));

  return (
    <div className="mx-auto max-w-[1400px]">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-ink">Consultas de hoje</h1>
          <p className="mt-1 text-lg text-muted">
            {saudacao()}, {primeiroNome(usuario.nome_completo)}. {dataPorExtenso()}.
          </p>
        </div>
        <Relogio className="text-3xl text-gate-ink" />
      </header>

      <p className="mt-5 flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm text-muted">
        <span>
          <b className="text-ink">{consultas.loading ? "…" : deHoje.length}</b> consultas
        </span>
        <span>
          <b className="text-ink">{consultas.loading ? "…" : encerradas}</b> encerradas
        </span>
        <span>
          adesão média <b className="text-ink">{pacientes.loading ? "…" : adesaoMedia === null ? "—" : `${adesaoMedia}%`}</b>{" "}
          · 7 dias
        </span>
      </p>

      <div className="mt-6 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="min-w-0 space-y-10">
          <section aria-label="Painel de consultas de hoje" className="overflow-hidden rounded-lg border border-line bg-bg lg:pt-3">
            <Estado loading={consultas.loading} error={consultas.error} onRetry={consultas.reload}>
              <PainelConsultas
                consultas={deHoje}
                selecionadaId={selecionada?.id}
                onSelect={(c) => setSelecionadaId(c.id)}
                onChange={(c) => setAtualizadas((prev) => ({ ...prev, [c.id]: c }))}
                vazio="Nenhuma consulta marcada para hoje."
              />
            </Estado>
          </section>

          <section aria-labelledby="atencao">
            <h2 id="atencao" className="text-xl font-bold text-ink">
              Precisam de atenção
            </h2>
            <p className="mt-1 text-base text-muted">Adesão abaixo de {LIMITE_ATENCAO}% nos últimos 7 dias.</p>
            <div className="mt-3">
              <Estado
                loading={pacientes.loading}
                error={pacientes.error}
                onRetry={pacientes.reload}
                linhas={2}
                vazio={atencao.length === 0}
                mensagemVazio={
                  comAdesao.length
                    ? `Todos os pacientes estão com ${LIMITE_ATENCAO}% ou mais.`
                    : "Nenhum paciente com meta calórica definida ainda."
                }
              >
                <motion.ul
                  variants={cascata.container}
                  initial="hidden"
                  animate="show"
                  className="divide-y divide-line border-y border-line"
                >
                  {atencao.map((p) => (
                    <motion.li key={p.id} variants={cascata.item}>
                      <Link
                        href={`/pacientes/${p.id}`}
                        className="group flex items-center gap-4 px-1 py-3.5 transition-colors hover:bg-surface/70"
                      >
                        <AlertTriangle className="size-5 shrink-0 text-alert" strokeWidth={2} aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-lg font-semibold text-ink">{p.nome_completo}</span>
                          <span className="block truncate text-sm text-muted">{p.meta ?? "Sem objetivo definido"}</span>
                        </span>
                        <span className="font-mono text-xl font-bold text-alert">{p.adesao_7d}%</span>
                        <ArrowRight
                          className="size-4 text-muted transition-transform duration-200 ease-out group-hover:translate-x-1"
                          aria-hidden
                        />
                      </Link>
                    </motion.li>
                  ))}
                </motion.ul>
              </Estado>
            </div>
          </section>
        </div>

        <aside aria-label="Paciente selecionado" className="xl:sticky xl:top-8">
          {pacienteDoCartao ? (
            <CartaoEmbarque paciente={pacienteDoCartao} consulta={selecionada} linkFicha />
          ) : (
            !pacientes.loading &&
            !consultas.loading && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
                className="rounded-[14px] border border-dashed border-line px-6 py-8 text-base text-muted"
              >
                Selecione uma consulta para ver o cartão do paciente.
              </motion.p>
            )
          )}
        </aside>
      </div>
    </div>
  );
}
