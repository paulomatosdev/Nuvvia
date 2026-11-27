"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarCheck, MapPin, RefreshCw, Sparkles, Video } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Estado } from "@/components/Estado";
import { EASE_OUT } from "@/components/motion";
import { PainelConsultas } from "@/components/PainelConsultas";
import { SolicitarConsulta } from "@/components/SolicitarConsulta";
import { api } from "@/lib/api";
import { hora, rotuloDia, STATUS_LABEL } from "@/lib/format";
import { Consulta, ResultadoAgendamento } from "@/lib/types";
import { useApi } from "@/lib/useApi";

export default function MinhasConsultasPage() {
  return (
    <AppShell area="paciente">
      <MinhasConsultas />
    </AppShell>
  );
}

const DATA_LONGA = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });

function ProximaConsulta({
  consulta,
  destaque,
  onAtualizada,
}: {
  consulta: Consulta;
  destaque: string | null;
  onAtualizada: (r: ResultadoAgendamento) => void;
}) {
  const [acao, setAcao] = useState<"confirmar" | "remarcar" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const online = consulta.tipo_consulta === "online";

  async function responder(a: "confirmar" | "remarcar") {
    setAcao(a);
    setErro(null);
    try {
      onAtualizada(await api.responderPresenca(consulta.id, a));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível atualizar a consulta");
    } finally {
      setAcao(null);
    }
  }

  return (
    <motion.article
      key={`${consulta.id}-${consulta.agendamento_data}`}
      initial={{ opacity: 0.35, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      aria-label="Próxima consulta"
      className="rounded-[14px] bg-pass text-pass-ink shadow-pass"
    >
      <div className="picote px-6 py-5">
        <p className="flex items-center gap-2 text-base text-pass-muted">
          {online ? <Video className="size-4" aria-hidden /> : <MapPin className="size-4" aria-hidden />}
          {online ? "Consulta online" : consulta.local ?? "Presencial"}
        </p>
        <p className="mt-2 text-3xl font-extrabold tracking-[-0.02em]">
          {DATA_LONGA.format(new Date(consulta.agendamento_data))}
        </p>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-3 font-mono text-2xl font-bold">
          {hora(consulta.agendamento_data)}
          <span className="font-sans text-lg font-semibold">com {consulta.nutricionista.nome_completo}</span>
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.1em]">
          <span className={`size-1.5 rounded-full ${consulta.status === "confirmado" ? "bg-pass-ok" : "bg-gate"}`} aria-hidden />
          {consulta.status === "confirmado" ? "Presença confirmada" : STATUS_LABEL[consulta.status]}
        </p>
      </div>
      <div className="px-6 py-5">
        {(destaque || consulta.motivo_agente) && (
          <p className="flex gap-2 text-base text-pass-muted">
            <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <b className="text-pass-ink">Por que este horário: </b>
              {destaque ?? consulta.motivo_agente}
            </span>
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {consulta.status === "agendado" && (
            <button
              type="button"
              onClick={() => responder("confirmar")}
              disabled={acao !== null}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-gate px-4 text-base font-bold text-[rgb(11_15_20)] transition-[filter] hover:brightness-95 disabled:opacity-60"
            >
              <CalendarCheck className="size-4" aria-hidden />
              {acao === "confirmar" ? "Confirmando…" : "Vou comparecer"}
            </button>
          )}
          <button
            type="button"
            onClick={() => responder("remarcar")}
            disabled={acao !== null}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-pass-line px-4 text-base font-semibold text-pass-ink transition-colors hover:bg-pass-ink/5 disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${acao === "remarcar" ? "animate-spin" : ""}`} aria-hidden />
            {acao === "remarcar" ? "Procurando outro horário…" : "Preciso remarcar"}
          </button>
        </div>
        {erro && (
          <p role="alert" className="mt-3 text-base text-pass-alert">
            {erro}
          </p>
        )}
      </div>
    </motion.article>
  );
}

function MinhasConsultas() {
  const consultas = useApi(api.minhasConsultas);
  const nutricionista = useApi(api.minhaNutricionista);
  const [resultado, setResultado] = useState<ResultadoAgendamento | null>(null);
  const [abrirPrefs, setAbrirPrefs] = useState(false);

  // Resposta dada pelo sino de notificações: recarrega a lista
  useEffect(() => {
    const recarregar = () => {
      setResultado(null);
      consultas.reload();
    };
    window.addEventListener("nuvvia:consultas-mudaram", recarregar);
    return () => window.removeEventListener("nuvvia:consultas-mudaram", recarregar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vindo do questionário (?agendar=1), já abre as preferências
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("agendar") === "1") setAbrirPrefs(true);
  }, []);

  const agora = Date.now();
  const todas = (consultas.data ?? []).map((c) => (resultado?.consulta.id === c.id ? resultado.consulta : c));
  if (resultado && !todas.some((c) => c.id === resultado.consulta.id)) todas.push(resultado.consulta);
  const futuras = todas
    .filter((c) => new Date(c.agendamento_data).getTime() >= agora && c.status !== "cancelado")
    .sort((a, b) => new Date(a.agendamento_data).getTime() - new Date(b.agendamento_data).getTime());
  const proxima = futuras.find((c) => c.status === "agendado" || c.status === "confirmado") ?? null;
  const anteriores = todas.filter((c) => new Date(c.agendamento_data).getTime() < agora).reverse();

  function aoAtualizar(r: ResultadoAgendamento) {
    setResultado(r);
    nutricionista.reload();
  }

  return (
    <div className="mx-auto max-w-[900px]">
      <header>
        <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-ink">Consultas</h1>
        {nutricionista.data && (
          <p className="mt-1 text-lg text-muted">
            Acompanhamento com <b className="text-ink">{nutricionista.data.nome_completo}</b>. As consultas são marcadas com ela.
          </p>
        )}
      </header>

      <div className="mt-6">
        <Estado loading={consultas.loading} error={consultas.error} onRetry={consultas.reload} linhas={2}>
          <AnimatePresence mode="popLayout" initial={false}>
            {proxima ? (
              <ProximaConsulta
                key="proxima"
                consulta={proxima}
                destaque={resultado?.consulta.id === proxima.id ? resultado.explicacao : null}
                onAtualizada={aoAtualizar}
              />
            ) : (
              <motion.div key="solicitar" initial={{ opacity: 0.35 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SolicitarConsulta onAgendada={aoAtualizar} abrirPreferencias={abrirPrefs} />
              </motion.div>
            )}
          </AnimatePresence>
        </Estado>
      </div>

      {resultado && resultado.alternativas.length > 0 && proxima?.id === resultado.consulta.id && (
        <motion.section
          initial={{ opacity: 0.35, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.2 }}
          aria-labelledby="alternativas"
          className="mt-5"
        >
          <h2 id="alternativas" className="rotulo text-muted">
            Outras opções que o agente avaliou
          </h2>
          <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
            {resultado.alternativas.map((o) => (
              <li key={`${o.nutricionista.id}-${o.inicio}`} className="flex flex-wrap items-baseline justify-between gap-x-4 px-4 py-2.5 text-base">
                <span className="text-ink">
                  {rotuloDia(o.inicio)}, <span className="font-mono">{hora(o.inicio)}</span> · {o.nutricionista.nome_completo}
                </span>
                <span className="text-sm text-muted">{o.tipo === "online" ? "Online" : o.local}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted">Se precisar trocar, use “Preciso remarcar” que o agente procura outro horário.</p>
        </motion.section>
      )}

      {futuras.filter((c) => c.id !== proxima?.id).length > 0 && (
        <section aria-labelledby="proximas" className="mt-10">
          <h2 id="proximas" className="text-xl font-bold text-ink">
            Também marcadas
          </h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-line lg:pt-3">
            <PainelConsultas
              consultas={futuras.filter((c) => c.id !== proxima?.id)}
              visaoPaciente
              destacarProxima={false}
              rotuloDia={(c) => rotuloDia(c.agendamento_data)}
            />
          </div>
        </section>
      )}

      {anteriores.length > 0 && (
        <section aria-labelledby="anteriores" className="mt-10">
          <h2 id="anteriores" className="text-xl font-bold text-ink">
            Anteriores
          </h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-line lg:pt-3">
            <PainelConsultas
              consultas={anteriores}
              visaoPaciente
              destacarProxima={false}
              rotuloDia={(c) => rotuloDia(c.agendamento_data)}
            />
          </div>
        </section>
      )}

      {proxima && (
        <p className="mt-8 text-sm text-muted">
          Na véspera você recebe uma notificação para confirmar presença ou remarcar.
        </p>
      )}
    </div>
  );
}
