"use client";

import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

/** Curva padrão: saída exponencial, rápida no começo e assentando suave. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Mola sem quique para movimentos de layout (linhas que trocam de lugar). */
export const MOLA_LAYOUT = { type: "spring", stiffness: 420, damping: 40, mass: 0.9 } as const;

const fmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

/**
 * Número que conta até o valor quando entra na tela.
 * O valor final já está no DOM (acessível e visível sem JS); só a contagem é animada.
 */
export function Numero({
  valor,
  sufixo = "",
  className = "",
  duracao = 0.9,
}: {
  valor: number;
  sufixo?: string;
  className?: string;
  duracao?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const visto = useInView(ref, { once: true, margin: "-40px" });
  const reduzir = useReducedMotion();
  const final = `${fmt.format(valor)}${sufixo}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduzir || !visto) {
      el.textContent = final;
      return;
    }
    const controle = animate(0, valor, {
      duration: duracao,
      ease: EASE_OUT,
      onUpdate: (v) => {
        el.textContent = `${fmt.format(v)}${sufixo}`;
      },
    });
    return () => controle.stop();
  }, [valor, sufixo, final, visto, reduzir, duracao]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {final}
    </span>
  );
}

/** Barra de progresso que se preenche a partir da esquerda. */
export function Barra({
  pct,
  className = "",
  trilho = "bg-line",
  preenchimento = "bg-ink",
  atraso = 0,
}: {
  pct: number;
  className?: string;
  trilho?: string;
  preenchimento?: string;
  atraso?: number;
}) {
  const reduzir = useReducedMotion();
  const largura = Math.max(0, Math.min(pct, 100));
  return (
    <div className={`h-2 overflow-hidden rounded-full ${trilho} ${className}`} aria-hidden>
      <motion.div
        className={`h-full origin-left rounded-full ${preenchimento}`}
        style={{ width: `${largura}%` }}
        initial={reduzir ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, ease: EASE_OUT, delay: atraso }}
      />
    </div>
  );
}

/** Entrada em cascata curta para listas: cada item sobe 6px e aparece. */
export const cascata = {
  container: {
    hidden: {},
    show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
  },
  item: {
    hidden: { opacity: 0.35, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
  },
} as const;
