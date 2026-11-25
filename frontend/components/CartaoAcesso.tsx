"use client";

import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { BotaoTema, Marca } from "./AppShell";
import { EASE_OUT } from "./motion";

/** Classe dos campos sobre o cartão (login e cadastro). */
export const campoCartao =
  "w-full rounded-md border border-pass-line bg-transparent px-3 py-2.5 text-base text-pass-ink outline-none transition-colors placeholder:text-pass-muted focus:border-gate";

export function CampoCartao({
  id,
  rotulo,
  dica,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; rotulo: string; dica?: string }) {
  return (
    <div>
      <label htmlFor={id} className="rotulo mb-1.5 block text-pass-muted">
        {rotulo}
      </label>
      <input id={id} className={campoCartao} aria-describedby={dica ? `${id}-dica` : undefined} {...props} />
      {dica && (
        <p id={`${id}-dica`} className="mt-1.5 text-sm text-pass-muted">
          {dica}
        </p>
      )}
    </div>
  );
}

/**
 * Cartão de embarque usado nas telas de acesso: canhoto com a marca,
 * picote, e o formulário embaixo. Treme de leve quando há erro.
 */
export function CartaoAcesso({
  subtitulo,
  erro,
  onSubmit,
  children,
  rodape,
}: {
  subtitulo: string;
  erro: string | null;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  rodape?: React.ReactNode;
}) {
  const reduzir = useReducedMotion();
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-10">
        <BotaoTema className="absolute right-4 top-4" />
        <motion.form
          onSubmit={onSubmit}
          noValidate={false}
          initial={reduzir ? false : { clipPath: "inset(0 0 100% 0 round 14px)" }}
          animate={{ clipPath: "inset(0 0 0% 0 round 14px)", x: erro ? [0, -6, 6, -3, 3, 0] : 0 }}
          transition={{ clipPath: { duration: 0.8, ease: EASE_OUT }, x: { duration: 0.4 } }}
          className="w-full max-w-sm rounded-[14px] bg-pass text-pass-ink shadow-pass"
        >
          <div className="picote px-7 pb-7 pt-8">
            <h1 className="text-5xl">
              <Marca />
            </h1>
            <p className="mt-2 text-lg text-pass-muted">{subtitulo}</p>
          </div>

          <div className="flex flex-col gap-5 px-7 pb-7 pt-8">
            {children}
            {erro && (
              <p role="alert" className="text-base text-pass-alert">
                {erro}
              </p>
            )}
          </div>
        </motion.form>
        {rodape && <div className="mt-6 text-base text-muted">{rodape}</div>}
      </div>
    </MotionConfig>
  );
}

export function BotaoEmbarcar({ carregando, children }: { carregando: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={carregando}
      className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gate text-base font-bold text-[rgb(11_15_20)] transition-[filter,transform] duration-150 hover:brightness-95 active:scale-[0.98] disabled:opacity-60"
    >
      {children}
    </button>
  );
}
