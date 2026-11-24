"use client";

import { useCallback, useEffect, useState } from "react";

export type Tema = "claro" | "escuro";

function temaAtual(): Tema {
  return document.documentElement.classList.contains("dark") ? "escuro" : "claro";
}

/** Tema claro/escuro. Sem escolha salva, segue o sistema e acompanha mudanças dele. */
export function useTema() {
  const [tema, setTema] = useState<Tema>("claro");

  useEffect(() => {
    setTema(temaAtual());
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const aoMudarSistema = (e: MediaQueryListEvent) => {
      if (localStorage.getItem("tema")) return;
      document.documentElement.classList.toggle("dark", e.matches);
      setTema(e.matches ? "escuro" : "claro");
    };
    mq.addEventListener("change", aoMudarSistema);
    return () => mq.removeEventListener("change", aoMudarSistema);
  }, []);

  const alternar = useCallback(() => {
    const proximo: Tema = temaAtual() === "escuro" ? "claro" : "escuro";
    const aplicar = () => {
      document.documentElement.classList.toggle("dark", proximo === "escuro");
      localStorage.setItem("tema", proximo);
      setTema(proximo);
    };
    // Transição suave entre temas onde o navegador suporta View Transitions
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (doc.startViewTransition && !reduzir) doc.startViewTransition(aplicar);
    else aplicar();
  }, []);

  return { tema, alternar };
}
