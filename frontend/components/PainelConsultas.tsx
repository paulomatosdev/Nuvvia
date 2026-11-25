"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Check, MapPin, Video, X } from "lucide-react";
import { api } from "@/lib/api";
import { hora, STATUS_LABEL } from "@/lib/format";
import { Consulta, StatusConsulta } from "@/lib/types";
import { EASE_OUT, MOLA_LAYOUT } from "./motion";

const ENCERRADAS: StatusConsulta[] = ["completado", "cancelado", "nao_comparecimento"];

export const estaEncerrada = (c: Consulta) => ENCERRADAS.includes(c.status);

/**
 * Como num painel de embarque: em aberto primeiro, por horário; encerradas
 * descem para o fim. Uma consulta que muda de estado troca de lugar animada.
 */
export function ordenarPainel(consultas: Consulta[]) {
  const porHora = (a: Consulta, b: Consulta) =>
    new Date(a.agendamento_data).getTime() - new Date(b.agendamento_data).getTime();
  return [
    ...consultas.filter((c) => !estaEncerrada(c)).sort(porHora),
    ...consultas.filter(estaEncerrada).sort(porHora),
  ];
}

/** Primeira consulta em aberto que ainda não começou (a "próxima"). */
export function proximaConsulta(consultas: Consulta[], agora = Date.now()) {
  return ordenarPainel(consultas).find(
    (c) => !estaEncerrada(c) && new Date(c.agendamento_data).getTime() + c.duracao_minutos * 60_000 > agora
  );
}

const ACOES: Partial<Record<StatusConsulta, { status: StatusConsulta; label: string }[]>> = {
  agendado: [
    { status: "confirmado", label: "Confirmar" },
    { status: "cancelado", label: "Cancelar" },
  ],
  confirmado: [
    { status: "completado", label: "Concluir" },
    { status: "nao_comparecimento", label: "Faltou" },
    { status: "cancelado", label: "Cancelar" },
  ],
};

function PilulaStatus({ status, proxima }: { status: StatusConsulta; proxima: boolean }) {
  if (proxima) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded bg-gate px-2 py-1 text-xs font-bold uppercase tracking-[0.1em] text-[rgb(11_15_20)]">
        Próxima
      </span>
    );
  }
  const base = "inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em]";
  switch (status) {
    case "confirmado":
      return (
        <span className={`${base} text-ok`}>
          <span className="size-1.5 rounded-full bg-ok" aria-hidden />
          {STATUS_LABEL[status]}
        </span>
      );
    case "completado":
      return (
        <span className={`${base} text-muted`}>
          <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
          {STATUS_LABEL[status]}
        </span>
      );
    case "cancelado":
    case "nao_comparecimento":
      return (
        <span className={`${base} text-alert`}>
          <X className="size-3.5" strokeWidth={2.5} aria-hidden />
          {STATUS_LABEL[status]}
        </span>
      );
    default:
      return <span className={`${base} text-muted`}>{STATUS_LABEL[status]}</span>;
  }
}

function LinhaConsulta({
  consulta,
  proxima,
  acesa,
  selecionada,
  onSelect,
  onChange,
  rotuloDia,
  visaoPaciente,
}: {
  consulta: Consulta;
  proxima: boolean;
  acesa: boolean;
  selecionada: boolean;
  onSelect?: (c: Consulta) => void;
  onChange?: (c: Consulta) => void;
  rotuloDia?: string;
  visaoPaciente: boolean;
}) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const encerrada = estaEncerrada(consulta);
  const acoes = onChange ? ACOES[consulta.status] ?? [] : [];
  const online = consulta.tipo_consulta === "online";

  async function mudarStatus(status: StatusConsulta) {
    setSalvando(true);
    setErro(null);
    try {
      onChange?.(await api.atualizarStatusConsulta(consulta.id, status));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível atualizar");
    } finally {
      setSalvando(false);
    }
  }

  const fundo = acesa
    ? "bg-gate/30 dark:bg-gate/20"
    : selecionada
      ? "bg-surface"
      : proxima
        ? "bg-gate/[0.08]"
        : "hover:bg-surface/70";

  return (
    <motion.li
      layout="position"
      transition={MOLA_LAYOUT}
      className={`group relative grid grid-cols-[4.25rem_1fr] items-center sm:grid-cols-[4.25rem_1fr_auto] gap-x-4 px-4 py-3.5 transition-colors duration-500 lg:grid-cols-[4.75rem_1fr_8.5rem_9rem] ${fundo} ${
        encerrada && !acesa ? "text-muted" : ""
      }`}
    >
      <span className={`font-mono text-lg font-bold ${encerrada ? "text-muted" : "text-ink"}`}>
        {hora(consulta.agendamento_data)}
      </span>

      <div className="min-w-0">
        {visaoPaciente ? (
          <p className={`truncate text-lg font-semibold ${encerrada ? "text-muted" : "text-ink"}`}>
            {consulta.nutricionista.nome_completo}
          </p>
        ) : onSelect ? (
          <button
            type="button"
            onClick={() => onSelect(consulta)}
            aria-pressed={selecionada}
            className={`block max-w-full truncate text-left text-lg font-semibold after:absolute after:inset-0 ${
              encerrada ? "text-muted" : "text-ink"
            }`}
          >
            {consulta.paciente.nome_completo}
          </button>
        ) : (
          <Link
            href={`/pacientes/${consulta.paciente_id}`}
            className={`block truncate text-lg font-semibold hover:underline ${encerrada ? "text-muted" : "text-ink"}`}
          >
            {consulta.paciente.nome_completo}
          </Link>
        )}
        <p className="truncate text-sm text-muted">
          <span className="lg:hidden">{online ? "Online" : "Presencial"} · </span>
          {[rotuloDia, `${consulta.duracao_minutos} min`, consulta.local].filter(Boolean).join(" · ")}
        </p>
        {erro && (
          <p role="alert" className="mt-1 text-sm text-alert">
            {erro}
          </p>
        )}
      </div>

      <span className="hidden items-center gap-2 text-base text-muted lg:flex">
        {online ? <Video className="size-4" aria-hidden /> : <MapPin className="size-4" aria-hidden />}
        {online ? "Online" : "Presencial"}
      </span>

      <div className="col-start-2 mt-1 flex items-center gap-3 sm:col-start-auto sm:mt-0 sm:justify-end lg:justify-start">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={`${consulta.status}-${proxima}`}
            // Como a palheta de um painel split-flap: o novo estado cai de cima
            initial={{ rotateX: -90, opacity: 0.4 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: 90, opacity: 0.4 }}
            transition={{ duration: 0.32, ease: EASE_OUT }}
            style={{ transformPerspective: 400, transformOrigin: "50% 0%", display: "inline-block" }}
          >
            <PilulaStatus status={consulta.status} proxima={proxima} />
          </motion.span>
        </AnimatePresence>
      </div>

      {acoes.length > 0 && (
        <div className="relative z-10 col-span-full mt-2 flex flex-wrap gap-1.5 lg:col-span-1 lg:col-start-2 lg:mt-2 [@media(hover:hover)]:pointer-events-none [@media(hover:hover)]:h-0 [@media(hover:hover)]:mt-0 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:pointer-events-auto [@media(hover:hover)]:group-focus-within:mt-2 [@media(hover:hover)]:group-focus-within:h-auto [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:pointer-events-auto [@media(hover:hover)]:group-hover:mt-2 [@media(hover:hover)]:group-hover:h-auto [@media(hover:hover)]:group-hover:opacity-100">
          {acoes.map((a) => (
            <button
              key={a.status}
              type="button"
              disabled={salvando}
              onClick={() => mudarStatus(a.status)}
              className="rounded border border-line bg-bg px-2.5 py-1 text-sm font-semibold text-ink transition-colors hover:border-ink/40 disabled:opacity-50"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {acesa && (
        <span className="sr-only" role="status">
          {consulta.paciente.nome_completo}: {STATUS_LABEL[consulta.status]}
        </span>
      )}
    </motion.li>
  );
}

/**
 * Painel de embarque das consultas. Linhas que mudam de estado reordenam no
 * lugar e ficam acesas por alguns segundos, para serem notadas.
 */
export function PainelConsultas({
  consultas,
  onChange,
  onSelect,
  selecionadaId,
  rotuloDia,
  destacarProxima = true,
  vazio,
  visaoPaciente = false,
}: {
  consultas: Consulta[];
  onChange?: (c: Consulta) => void;
  onSelect?: (c: Consulta) => void;
  selecionadaId?: string | null;
  rotuloDia?: (c: Consulta) => string | undefined;
  destacarProxima?: boolean;
  vazio?: React.ReactNode;
  /** Paciente vendo as próprias consultas: mostra a nutricionista. */
  visaoPaciente?: boolean;
}) {
  const [acesas, setAcesas] = useState<Set<string>>(new Set());
  const ordenadas = ordenarPainel(consultas);
  const proxima = destacarProxima ? proximaConsulta(consultas) : undefined;

  function aoMudar(c: Consulta) {
    setAcesas((prev) => new Set(prev).add(c.id));
    // A linha muda de lugar e fica acesa por alguns segundos para ser notada
    window.setTimeout(() => notada(c.id), 6000);
    onChange?.(c);
  }

  function notada(id: string) {
    setAcesas((prev) => {
      const novo = new Set(prev);
      novo.delete(id);
      return novo;
    });
  }

  return (
    <div>
      <div
        className="rotulo hidden grid-cols-[4.75rem_1fr_8.5rem_9rem] gap-x-4 border-b border-line px-4 pb-2 text-muted lg:grid"
        aria-hidden
      >
        <span>Hora</span>
        <span>{visaoPaciente ? "Nutricionista" : "Paciente"}</span>
        <span>Tipo</span>
        <span>Status</span>
      </div>
      {ordenadas.length === 0 ? (
        <div className="px-4 py-8 text-base text-muted">{vazio}</div>
      ) : (
        <LayoutGroup>
          <ul className="divide-y divide-line">
            {ordenadas.map((c) => (
              <LinhaConsulta
                key={c.id}
                consulta={c}
                proxima={proxima?.id === c.id}
                acesa={acesas.has(c.id)}
                selecionada={selecionadaId === c.id}
                onSelect={onSelect}
                onChange={onChange ? aoMudar : undefined}
                rotuloDia={rotuloDia?.(c)}
                visaoPaciente={visaoPaciente}
              />
            ))}
          </ul>
        </LayoutGroup>
      )}
    </div>
  );
}
