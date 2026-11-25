"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Estado } from "@/components/Estado";
import { EASE_OUT } from "@/components/motion";
import { NovaConsultaForm } from "@/components/NovaConsultaForm";
import { PainelConsultas } from "@/components/PainelConsultas";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { rotuloDia } from "@/lib/format";
import { useApi } from "@/lib/useApi";

export default function MinhasConsultasPage() {
  return (
    <AppShell area="paciente">
      <MinhasConsultas />
    </AppShell>
  );
}

function MinhasConsultas() {
  const { data, loading, error, reload } = useApi(api.minhasConsultas);
  const [agendando, setAgendando] = useState(false);

  const agora = Date.now();
  const todas = data ?? [];
  const proximas = todas.filter((c) => new Date(c.agendamento_data).getTime() >= agora);
  const anteriores = todas.filter((c) => new Date(c.agendamento_data).getTime() < agora);

  return (
    <div className="mx-auto max-w-[1000px]">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-ink">Consultas</h1>
        <Button onClick={() => setAgendando((v) => !v)} aria-expanded={agendando}>
          <motion.span animate={{ rotate: agendando ? 45 : 0 }} transition={{ duration: 0.3, ease: EASE_OUT }}>
            <Plus className="size-4" strokeWidth={2.5} aria-hidden />
          </motion.span>
          {agendando ? "Fechar" : "Agendar consulta"}
        </Button>
      </header>

      <AnimatePresence initial={false}>
        {agendando && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="pt-6">
              <NovaConsultaForm
                paraPaciente
                onCancel={() => setAgendando(false)}
                onCreated={() => {
                  setAgendando(false);
                  reload();
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section aria-labelledby="proximas" className="mt-8">
        <h2 id="proximas" className="text-xl font-bold text-ink">
          Próximas
        </h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-line lg:pt-3">
          <Estado loading={loading} error={error} onRetry={reload}>
            <PainelConsultas
              consultas={proximas}
              visaoPaciente
              rotuloDia={(c) => rotuloDia(c.agendamento_data)}
              vazio="Nenhuma consulta marcada. Use “Agendar consulta” para marcar a próxima."
            />
          </Estado>
        </div>
      </section>

      {anteriores.length > 0 && (
        <section aria-labelledby="anteriores" className="mt-10">
          <h2 id="anteriores" className="text-xl font-bold text-ink">
            Anteriores
          </h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-line lg:pt-3">
            <PainelConsultas
              consultas={[...anteriores].reverse()}
              visaoPaciente
              destacarProxima={false}
              rotuloDia={(c) => rotuloDia(c.agendamento_data)}
            />
          </div>
        </section>
      )}
    </div>
  );
}
