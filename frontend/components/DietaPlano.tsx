"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { numero } from "@/lib/format";
import { RotinaAlimentar } from "@/lib/types";
import { cascata, EASE_OUT, MOLA_LAYOUT } from "./motion";

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DIAS_LONGOS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

/** Dia da semana de hoje no formato da API (0 = segunda ... 6 = domingo). */
const hojeNaSemana = () => (new Date().getDay() + 6) % 7;

/**
 * Refeições de uma dieta, com os itens de cada uma. Quando a dieta tem um
 * cardápio por dia da semana, mostra abas e abre no dia de hoje.
 */
export function DietaPlano({ dieta }: { dieta: RotinaAlimentar }) {
  const porDia = dieta.refeicoes.some((r) => r.dia_semana !== null);
  const [dia, setDia] = useState(hojeNaSemana);
  const hoje = hojeNaSemana();
  const refeicoes = porDia ? dieta.refeicoes.filter((r) => r.dia_semana === dia) : dieta.refeicoes;

  return (
    <>
      {porDia && (
        <div role="tablist" aria-label="Dia da semana" className="flex gap-1 overflow-x-auto border-b border-line px-2 pt-2">
          {DIAS.map((nome, i) => (
            <button
              key={nome}
              type="button"
              role="tab"
              aria-selected={dia === i}
              aria-label={`${DIAS_LONGOS[i]}${i === hoje ? " (hoje)" : ""}`}
              onClick={() => setDia(i)}
              className={`relative shrink-0 px-3 pb-2.5 pt-1.5 text-sm font-semibold transition-colors ${
                dia === i ? "text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {nome}
              {i === hoje && <span className="ml-1 inline-block size-1.5 rounded-full bg-gate align-middle" aria-hidden />}
              {dia === i && (
                <motion.span
                  layoutId={`aba-dia-${dieta.id}`}
                  transition={MOLA_LAYOUT}
                  className="absolute inset-x-1 -bottom-px h-0.5 bg-ink"
                  aria-hidden
                />
              )}
            </button>
          ))}
        </div>
      )}
      <ListaRefeicoes key={dia} refeicoes={refeicoes} />
    </>
  );
}

function ListaRefeicoes({ refeicoes }: { refeicoes: RotinaAlimentar["refeicoes"] }) {
  return (
    <motion.ol variants={cascata.container} initial="hidden" animate="show" className="divide-y divide-line">
      {refeicoes.map((r) => {
        const itens = r.descricao.split(" · ");
        return (
          <motion.li
            key={r.id}
            variants={cascata.item}
            className="grid grid-cols-[3.75rem_1fr] gap-x-4 px-4 py-4 sm:grid-cols-[3.75rem_1fr_auto]"
          >
            <span className="font-mono text-base font-bold text-ink">{r.horario}</span>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-ink">{r.nome}</h3>
              <ul className="mt-1.5 space-y-1">
                {itens.map((item) => {
                  const [nome, quantidade] = item.split(" — ");
                  return (
                    <li key={item} className="flex items-baseline justify-between gap-3 text-base">
                      <span className="text-ink/90">{nome}</span>
                      {quantidade && <span className="shrink-0 font-mono text-sm text-muted">{quantidade}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
            {r.meta_calorias !== null && (
              <span className="col-start-2 mt-2 font-mono text-sm text-muted sm:col-start-auto sm:mt-0 sm:text-right">
                <b className="text-ink">{numero(r.meta_calorias)} kcal</b>
                {r.meta_proteina_g !== null && <span className="block">{numero(r.meta_proteina_g)} g prot.</span>}
              </span>
            )}
          </motion.li>
        );
      })}
    </motion.ol>
  );
}

/** "Como calculamos": a explicação do plano e as referências científicas. */
export function ComoCalculamos({
  explicacao,
  referencias = [],
  abertoInicial = false,
}: {
  explicacao: string;
  referencias?: { titulo: string; url: string }[];
  abertoInicial?: boolean;
}) {
  const [aberto, setAberto] = useState(abertoInicial);
  return (
    <div className="rounded-lg border border-line">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-base font-bold text-ink"
      >
        Como calculamos
        <motion.span animate={{ rotate: aberto ? 180 : 0 }} transition={{ duration: 0.3, ease: EASE_OUT }}>
          <ChevronDown className="size-4 text-muted" aria-hidden />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="space-y-2 border-t border-line px-4 py-4 text-base text-ink/90">
              {explicacao.split("\n").map((linha) => (
                <p key={linha} className="max-w-[70ch]">
                  {linha}
                </p>
              ))}
              {referencias.length > 0 && (
                <>
                  <h4 className="rotulo pt-3 text-muted">Referências</h4>
                  <ul className="space-y-1.5">
                    {referencias.map((r) => (
                      <li key={r.url}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-start gap-1.5 text-sm text-muted underline decoration-line hover:text-ink"
                        >
                          {r.titulo}
                          <ExternalLink className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
