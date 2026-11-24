"use client";

import { useEffect, useState } from "react";

/** Relógio do painel (HH:MM), atualizado a cada 15 segundos. */
export function Relogio({ className = "" }: { className?: string }) {
  const [agora, setAgora] = useState<Date | null>(null);
  useEffect(() => {
    setAgora(new Date());
    const id = window.setInterval(() => setAgora(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <time
      dateTime={agora?.toISOString()}
      className={`font-mono font-bold tabular-nums ${className}`}
      aria-label={agora ? `Agora são ${agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : undefined}
    >
      {agora ? agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
    </time>
  );
}
