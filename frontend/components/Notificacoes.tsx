"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bell, CalendarCheck, CalendarClock, HeartHandshake, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { Notificacao } from "@/lib/types";
import { EASE_OUT } from "./motion";

const INTERVALO_MS = 60_000;

const ICONES: Record<string, typeof Bell> = {
  consulta_marcada: CalendarClock,
  consulta_confirmada: CalendarCheck,
  consulta_remarcada: RefreshCw,
  lembrete_consulta: CalendarClock,
  vinculo: HeartHandshake,
};

function tempoAtras(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.round(h / 24)} d`;
}

function Item({ n, onMudou }: { n: Notificacao; onMudou: () => void }) {
  const [respondendo, setRespondendo] = useState<"confirmar" | "remarcar" | null>(null);
  const [resposta, setResposta] = useState<string | null>(null);
  const Icone = ICONES[n.tipo] ?? Bell;
  const pedeResposta = n.tipo === "lembrete_consulta" && !n.lida && n.consulta_id;

  async function responder(acao: "confirmar" | "remarcar") {
    if (!n.consulta_id) return;
    setRespondendo(acao);
    try {
      const r = await api.responderPresenca(n.consulta_id, acao);
      setResposta(acao === "confirmar" ? "Presença confirmada." : `Remarcada: ${r.explicacao}`);
      onMudou();
      // Avisa as telas abertas (ex.: Consultas) que a consulta mudou
      window.dispatchEvent(new Event("nuvvia:consultas-mudaram"));
    } catch (err) {
      setResposta(err instanceof Error ? err.message : "Não foi possível responder");
    } finally {
      setRespondendo(null);
    }
  }

  async function abrir() {
    if (!n.lida && !pedeResposta) {
      await api.marcarNotificacaoLida(n.id).catch(() => undefined);
      onMudou();
    }
  }

  return (
    <li className={`px-4 py-3 ${n.lida ? "" : "bg-gate/[0.07]"}`} onClick={abrir}>
      <div className="flex gap-3">
        <Icone className={`mt-0.5 size-4 shrink-0 ${n.lida ? "text-muted" : "text-ink"}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className={`text-base ${n.lida ? "font-medium text-ink/80" : "font-bold text-ink"}`}>{n.titulo}</p>
            <span className="shrink-0 font-mono text-xs text-muted">{tempoAtras(n.criacao_data)}</span>
          </div>
          <p className="mt-0.5 text-sm text-muted">{n.mensagem}</p>
          {pedeResposta && !resposta && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => responder("confirmar")}
                disabled={respondendo !== null}
                className="rounded-md bg-gate px-3 py-1.5 text-sm font-bold text-[rgb(11_15_20)] hover:brightness-95 disabled:opacity-60"
              >
                {respondendo === "confirmar" ? "Confirmando…" : "Vou comparecer"}
              </button>
              <button
                type="button"
                onClick={() => responder("remarcar")}
                disabled={respondendo !== null}
                className="rounded-md border border-line px-3 py-1.5 text-sm font-semibold text-ink hover:border-ink/40 disabled:opacity-60"
              >
                {respondendo === "remarcar" ? "Remarcando…" : "Preciso remarcar"}
              </button>
            </div>
          )}
          {resposta && (
            <p role="status" className="mt-2 text-sm font-semibold text-ok">
              {resposta}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

/** Sino com as notificações do usuário. Atualiza a cada minuto. */
export function Notificacoes({ className = "" }: { className?: string }) {
  const [aberto, setAberto] = useState(false);
  const [dados, setDados] = useState<{ nao_lidas: number; itens: Notificacao[] } | null>(null);
  const caixa = useRef<HTMLDivElement>(null);

  const carregar = useCallback(() => {
    api.notificacoes().then(setDados).catch(() => undefined);
  }, []);

  useEffect(() => {
    carregar();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") carregar();
    }, INTERVALO_MS);
    return () => window.clearInterval(id);
  }, [carregar]);

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const naoLidas = dados?.nao_lidas ?? 0;

  return (
    <div ref={caixa} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          setAberto((v) => !v);
          if (!aberto) carregar();
        }}
        aria-expanded={aberto}
        aria-label={naoLidas ? `Notificações, ${naoLidas} não lidas` : "Notificações"}
        className="relative grid size-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink"
      >
        <Bell className="size-[18px]" aria-hidden />
        <AnimatePresence>
          {naoLidas > 0 && (
            <motion.span
              key={naoLidas}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-gate px-1 font-mono text-[11px] font-bold leading-[18px] text-[rgb(11_15_20)]"
              aria-hidden
            >
              {naoLidas > 9 ? "9+" : naoLidas}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            role="dialog"
            aria-label="Notificações"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="fixed inset-x-3 top-16 z-50 max-h-[70vh] overflow-hidden rounded-lg border border-line bg-bg shadow-pass md:absolute md:inset-x-auto md:bottom-0 md:left-full md:top-auto md:ml-3 md:w-96 md:origin-bottom-left"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-base font-bold text-ink">Notificações</h2>
              {naoLidas > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    await api.marcarTodasLidas().catch(() => undefined);
                    carregar();
                  }}
                  className="text-sm font-semibold text-muted hover:text-ink"
                >
                  Marcar como lidas
                </button>
              )}
            </div>
            <ul className="max-h-[calc(70vh-3rem)] divide-y divide-line overflow-auto">
              {!dados || dados.itens.length === 0 ? (
                <li className="px-4 py-8 text-center text-base text-muted">Nenhuma notificação por enquanto.</li>
              ) : (
                dados.itens.map((n) => <Item key={n.id} n={n} onMudou={carregar} />)
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
