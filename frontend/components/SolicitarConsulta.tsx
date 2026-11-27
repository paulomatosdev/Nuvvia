"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { Periodo, PreferenciaTipo, ResultadoAgendamento } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { EASE_OUT, MOLA_LAYOUT } from "./motion";
import { Button } from "./ui/Button";

const TIPOS: { valor: PreferenciaTipo; label: string }[] = [
  { valor: "tanto_faz", label: "Tanto faz" },
  { valor: "pessoal", label: "Presencial" },
  { valor: "online", label: "Online" },
];

const PERIODOS: { valor: Periodo; label: string }[] = [
  { valor: "manha", label: "Manhã" },
  { valor: "tarde", label: "Tarde" },
  { valor: "noite", label: "Noite" },
];

/**
 * Pedido de consulta ao agente: um clique. As preferências são opcionais,
 * ficam salvas no perfil e o agente usa nas próximas vezes.
 */
export function SolicitarConsulta({
  onAgendada,
  abrirPreferencias = false,
}: {
  onAgendada: (r: ResultadoAgendamento) => void;
  abrirPreferencias?: boolean;
}) {
  const perfil = useApi(api.meuPerfilPaciente);
  const [aberto, setAberto] = useState(abrirPreferencias);
  const [tipo, setTipo] = useState<PreferenciaTipo>("tanto_faz");
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Preenche com as preferências já salvas
  useEffect(() => {
    const p = perfil.data;
    if (!p) return;
    setTipo(p.preferencia_tipo ?? "tanto_faz");
    setPeriodos(p.preferencia_periodos ?? []);
    setCidade(p.cidade ?? "");
    setBairro(p.bairro ?? "");
  }, [perfil.data]);

  async function solicitar() {
    setErro(null);
    setBuscando(true);
    try {
      const resultado = await api.solicitarConsulta({
        tipo,
        periodos,
        cidade: cidade.trim() || null,
        bairro: bairro.trim() || null,
      });
      onAgendada(resultado);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível solicitar a consulta");
    } finally {
      setBuscando(false);
    }
  }

  const resumo = [
    TIPOS.find((t) => t.valor === tipo)?.label,
    periodos.length ? periodos.map((p) => PERIODOS.find((x) => x.valor === p)?.label).join(", ") : "qualquer horário",
    cidade.trim() || null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-ink">Solicitar consulta</h2>
          <p className="text-base text-muted">
            O agente escolhe a nutricionista, o dia, o horário e o local que melhor combinam com você.
          </p>
        </div>
        <Button onClick={solicitar} disabled={buscando} className="relative overflow-hidden">
          <Sparkles className="size-4" aria-hidden />
          {buscando ? "Procurando o melhor horário…" : "Solicitar consulta"}
          {buscando && (
            <motion.span
              aria-hidden
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
              initial={{ x: "-120%" }}
              animate={{ x: "320%" }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
            />
          )}
        </Button>
      </div>

      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        Preferências: {resumo}
        <motion.span animate={{ rotate: aberto ? 180 : 0 }} transition={{ duration: 0.3, ease: EASE_OUT }}>
          <ChevronDown className="size-4" aria-hidden />
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
            <div className="grid gap-5 pt-4 sm:grid-cols-2">
              <fieldset>
                <legend className="rotulo mb-1.5 text-muted">Tipo de consulta</legend>
                <div role="radiogroup" className="flex gap-1 rounded-md border border-line p-1">
                  {TIPOS.map((t) => (
                    <button
                      key={t.valor}
                      type="button"
                      role="radio"
                      aria-checked={tipo === t.valor}
                      onClick={() => setTipo(t.valor)}
                      className={`relative flex-1 rounded px-2 py-1.5 text-sm font-semibold transition-colors ${
                        tipo === t.valor ? "text-bg" : "text-muted hover:text-ink"
                      }`}
                    >
                      {tipo === t.valor && (
                        <motion.span layoutId="tipo-consulta" transition={MOLA_LAYOUT} className="absolute inset-0 rounded bg-ink" />
                      )}
                      <span className="relative">{t.label}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="rotulo mb-1.5 text-muted">Períodos que você pode</legend>
                <div className="flex flex-wrap gap-2">
                  {PERIODOS.map((p) => {
                    const ativo = periodos.includes(p.valor);
                    return (
                      <button
                        key={p.valor}
                        type="button"
                        aria-pressed={ativo}
                        onClick={() => setPeriodos((prev) => (ativo ? prev.filter((x) => x !== p.valor) : [...prev, p.valor]))}
                        className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                          ativo ? "border-ink bg-ink text-bg" : "border-line text-ink hover:border-ink/40"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-xs text-muted">Sem marcar nenhum, vale qualquer horário.</p>
              </fieldset>
              <label className="block">
                <span className="rotulo mb-1.5 block text-muted">Cidade</span>
                <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex.: São Paulo" className="campo" />
              </label>
              <label className="block">
                <span className="rotulo mb-1.5 block text-muted">Bairro</span>
                <input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Ex.: Pinheiros" className="campo" />
              </label>
            </div>
            <p className="mt-3 text-sm text-muted">
              Para consultas presenciais, o agente prioriza quem atende no seu bairro e depois na sua cidade.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {erro && (
        <p role="alert" className="mt-4 text-base text-alert">
          {erro}
        </p>
      )}
    </div>
  );
}
