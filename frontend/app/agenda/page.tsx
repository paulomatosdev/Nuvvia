"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Estado } from "@/components/Estado";
import { EASE_OUT, MOLA_LAYOUT } from "@/components/motion";
import { NovaConsultaForm } from "@/components/NovaConsultaForm";
import { PainelConsultas } from "@/components/PainelConsultas";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { isHoje, rotuloDia } from "@/lib/format";
import { Consulta } from "@/lib/types";
import { useApi } from "@/lib/useApi";

export default function AgendaPage() {
  return (
    <AppShell>
      <Agenda />
    </AppShell>
  );
}

type Aba = "proximas" | "anteriores";

const ABAS: [Aba, string][] = [
  ["proximas", "Próximas"],
  ["anteriores", "Anteriores"],
];

function inicioDeHoje() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const DATA_LONGA = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });

function agruparPorDia(consultas: Consulta[]) {
  const grupos = new Map<string, Consulta[]>();
  for (const c of consultas) {
    const d = new Date(c.agendamento_data);
    const chave = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    grupos.set(chave, [...(grupos.get(chave) ?? []), c]);
  }
  return [...grupos.values()];
}

function Agenda() {
  const { data, loading, error, reload } = useApi(api.minhasConsultas);
  const [aba, setAba] = useState<Aba>("proximas");
  const [criando, setCriando] = useState(false);
  const [atualizadas, setAtualizadas] = useState<Record<string, Consulta>>({});

  const corte = inicioDeHoje();
  const todas = (data ?? []).map((c) => atualizadas[c.id] ?? c);
  const filtradas =
    aba === "proximas"
      ? todas.filter((c) => new Date(c.agendamento_data).getTime() >= corte)
      : todas.filter((c) => new Date(c.agendamento_data).getTime() < corte);
  const grupos = agruparPorDia(filtradas);
  if (aba === "anteriores") grupos.reverse();

  return (
    <div className="mx-auto max-w-[1100px]">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-ink">Agenda</h1>
        <Button onClick={() => setCriando((v) => !v)} aria-expanded={criando}>
          <motion.span animate={{ rotate: criando ? 45 : 0 }} transition={{ duration: 0.3, ease: EASE_OUT }}>
            <Plus className="size-4" strokeWidth={2.5} aria-hidden />
          </motion.span>
          {criando ? "Fechar" : "Nova consulta"}
        </Button>
      </header>

      <AnimatePresence initial={false}>
        {criando && (
          <motion.div
            key="form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="pt-6">
              <NovaConsultaForm
                onCancel={() => setCriando(false)}
                onCreated={() => {
                  setCriando(false);
                  setAba("proximas");
                  reload();
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div role="tablist" aria-label="Período" className="mt-6 flex gap-1 border-b border-line">
        {ABAS.map(([valor, label]) => (
          <button
            key={valor}
            type="button"
            role="tab"
            aria-selected={aba === valor}
            onClick={() => setAba(valor)}
            className={`relative px-3 pb-2.5 pt-1 text-base font-semibold transition-colors ${
              aba === valor ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {label}
            {aba === valor && (
              <motion.span
                layoutId="aba-agenda"
                transition={MOLA_LAYOUT}
                className="absolute inset-x-0 -bottom-px h-0.5 bg-ink"
                aria-hidden
              />
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <Estado
          loading={loading}
          error={error}
          onRetry={reload}
          vazio={grupos.length === 0}
          mensagemVazio={aba === "proximas" ? "Nenhuma consulta agendada." : "Nenhuma consulta anterior."}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={aba}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="space-y-8"
            >
              {grupos.map((consultas) => {
                const dia = consultas[0].agendamento_data;
                const hoje = isHoje(dia);
                const titulo = DATA_LONGA.format(new Date(dia));
                const relativo = rotuloDia(dia);
                return (
                  <section key={dia} aria-label={titulo}>
                    <h2 className="flex items-baseline gap-3 px-1 pb-2">
                      <span className={`text-xl font-bold ${hoje ? "text-ink" : "text-ink/85"}`}>
                        {["Hoje", "Amanhã", "Ontem"].includes(relativo) ? relativo : titulo}
                      </span>
                      {["Hoje", "Amanhã", "Ontem"].includes(relativo) && (
                        <span className="text-base text-muted">{titulo}</span>
                      )}
                    </h2>
                    <div className="overflow-hidden rounded-lg border border-line lg:pt-3">
                      <PainelConsultas
                        consultas={consultas}
                        destacarProxima={hoje}
                        onChange={(c) => setAtualizadas((prev) => ({ ...prev, [c.id]: c }))}
                      />
                    </div>
                  </section>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </Estado>
      </div>
    </div>
  );
}
