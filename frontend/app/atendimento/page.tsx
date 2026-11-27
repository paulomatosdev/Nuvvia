"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Plus, X } from "lucide-react";
import { AppShell, useUsuario } from "@/components/AppShell";
import { Estado } from "@/components/Estado";
import { EASE_OUT } from "@/components/motion";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { JanelaDisponibilidade } from "@/lib/types";
import { useApi } from "@/lib/useApi";

export default function AtendimentoPage() {
  return (
    <AppShell>
      <Atendimento />
    </AppShell>
  );
}

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

type Janela = JanelaDisponibilidade & { chave: number };

function Interruptor({ ativo, onChange, rotulo }: { ativo: boolean; onChange: (v: boolean) => void; rotulo: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-line px-4 py-3">
      <span className="text-base font-semibold text-ink">{rotulo}</span>
      <button
        type="button"
        role="switch"
        aria-checked={ativo}
        onClick={() => onChange(!ativo)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${ativo ? "bg-ok" : "bg-line"}`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 600, damping: 35 }}
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow ${ativo ? "right-0.5" : "left-0.5"}`}
        />
      </button>
    </label>
  );
}

function Atendimento() {
  const usuario = useUsuario();
  const disponibilidade = useApi(api.minhaDisponibilidade);
  const perfilInicial = usuario.nutricionista_perfil;
  const [cidade, setCidade] = useState(perfilInicial?.cidade ?? "");
  const [bairro, setBairro] = useState(perfilInicial?.bairro ?? "");
  const [endereco, setEndereco] = useState(perfilInicial?.endereco ?? "");
  const [online, setOnline] = useState(perfilInicial?.atende_online ?? true);
  const [presencial, setPresencial] = useState(perfilInicial?.atende_presencial ?? true);
  const [duracao, setDuracao] = useState(perfilInicial?.duracao_consulta_min ?? 45);
  const [janelas, setJanelas] = useState<Janela[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [chave, setChave] = useState(0);

  useEffect(() => {
    if (disponibilidade.data) {
      setJanelas(disponibilidade.data.map((j, i) => ({ ...j, chave: i })));
      setChave(disponibilidade.data.length);
    }
  }, [disponibilidade.data]);

  function adicionar(dia: number) {
    const doDia = janelas.filter((j) => j.dia_semana === dia);
    const ultima = doDia[doDia.length - 1];
    const nova = ultima ? { hora_inicio: "14:00", hora_fim: "18:00" } : { hora_inicio: "08:00", hora_fim: "12:00" };
    setJanelas((prev) => [...prev, { dia_semana: dia, ...nova, chave }]);
    setChave((c) => c + 1);
  }

  const atualizar = (k: number, campo: "hora_inicio" | "hora_fim", v: string) =>
    setJanelas((prev) => prev.map((j) => (j.chave === k ? { ...j, [campo]: v } : j)));

  const invalidas = janelas.filter((j) => j.hora_fim <= j.hora_inicio);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (invalidas.length) {
      setErro("Há horários em que o fim é antes do início.");
      return;
    }
    if (!online && !presencial) {
      setErro("Escolha pelo menos uma forma de atendimento.");
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      await api.atualizarPerfilNutricionista({
        cidade: cidade.trim() || null,
        bairro: bairro.trim() || null,
        endereco: endereco.trim() || null,
        atende_online: online,
        atende_presencial: presencial,
        duracao_consulta_min: duracao,
      });
      await api.definirDisponibilidade(janelas.map(({ dia_semana, hora_inicio, hora_fim }) => ({ dia_semana, hora_inicio, hora_fim })));
      setSalvo(true);
      window.setTimeout(() => setSalvo(false), 2500);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="mx-auto max-w-[900px]">
      <header>
        <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-ink">Atendimento</h1>
        <p className="mt-1 text-lg text-muted">
          O agente de agendamento usa estas informações para marcar consultas com você.
        </p>
      </header>

      <section aria-labelledby="onde" className="mt-8">
        <h2 id="onde" className="text-xl font-bold text-ink">
          Onde você atende
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Interruptor ativo={presencial} onChange={setPresencial} rotulo="Atendo presencialmente" />
          <Interruptor ativo={online} onChange={setOnline} rotulo="Atendo online" />
          <label className="block">
            <span className="rotulo mb-1.5 block text-muted">Cidade</span>
            <input value={cidade} onChange={(e) => setCidade(e.target.value)} className="campo" placeholder="São Paulo" />
          </label>
          <label className="block">
            <span className="rotulo mb-1.5 block text-muted">Bairro</span>
            <input value={bairro} onChange={(e) => setBairro(e.target.value)} className="campo" placeholder="Pinheiros" />
          </label>
          <label className="block sm:col-span-2">
            <span className="rotulo mb-1.5 block text-muted">Endereço do consultório</span>
            <input value={endereco} onChange={(e) => setEndereco(e.target.value)} className="campo" placeholder="Rua, número, sala" />
          </label>
          <label className="block">
            <span className="rotulo mb-1.5 block text-muted">Duração da consulta (min)</span>
            <input
              type="number"
              min={15}
              max={180}
              step={5}
              value={duracao}
              onChange={(e) => setDuracao(Number(e.target.value))}
              className="campo font-mono"
            />
          </label>
        </div>
      </section>

      <section aria-labelledby="horarios" className="mt-10">
        <h2 id="horarios" className="text-xl font-bold text-ink">
          Horários de atendimento
        </h2>
        <p className="mt-1 text-base text-muted">O agente só marca consultas dentro destas janelas.</p>
        <div className="mt-3 overflow-hidden rounded-lg border border-line">
          <Estado loading={disponibilidade.loading} error={disponibilidade.error} onRetry={disponibilidade.reload} linhas={4}>
            <ul className="divide-y divide-line">
              {DIAS.map((nome, dia) => {
                const doDia = janelas.filter((j) => j.dia_semana === dia);
                return (
                  <li key={nome} className="grid gap-3 px-4 py-3 sm:grid-cols-[7rem_1fr_auto] sm:items-center">
                    <span className={`text-base font-semibold ${doDia.length ? "text-ink" : "text-muted"}`}>{nome}</span>
                    <div className="flex flex-wrap gap-2">
                      {doDia.length === 0 && <span className="py-2 text-sm text-muted">Sem atendimento</span>}
                      <AnimatePresence initial={false}>
                        {doDia.map((j) => {
                          const invalida = j.hora_fim <= j.hora_inicio;
                          return (
                            <motion.span
                              key={j.chave}
                              layout
                              initial={{ opacity: 0.35, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.96 }}
                              transition={{ duration: 0.2, ease: EASE_OUT }}
                              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-1 ${
                                invalida ? "border-alert" : "border-line"
                              }`}
                            >
                              <input
                                type="time"
                                aria-label={`${nome}, início`}
                                value={j.hora_inicio}
                                onChange={(e) => atualizar(j.chave, "hora_inicio", e.target.value)}
                                className="rounded bg-transparent px-1 py-1 font-mono text-sm text-ink outline-none focus:bg-surface"
                              />
                              <span className="text-muted">–</span>
                              <input
                                type="time"
                                aria-label={`${nome}, fim`}
                                value={j.hora_fim}
                                onChange={(e) => atualizar(j.chave, "hora_fim", e.target.value)}
                                className="rounded bg-transparent px-1 py-1 font-mono text-sm text-ink outline-none focus:bg-surface"
                              />
                              <button
                                type="button"
                                aria-label={`Remover horário de ${nome}`}
                                onClick={() => setJanelas((prev) => prev.filter((x) => x.chave !== j.chave))}
                                className="grid size-7 place-items-center rounded text-muted hover:bg-surface hover:text-ink"
                              >
                                <X className="size-3.5" aria-hidden />
                              </button>
                            </motion.span>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => adicionar(dia)} aria-label={`Adicionar horário na ${nome}`}>
                      <Plus className="size-4" aria-hidden />
                      Horário
                    </Button>
                  </li>
                );
              })}
            </ul>
          </Estado>
        </div>
      </section>

      {erro && (
        <p role="alert" className="mt-5 text-base text-alert">
          {erro}
        </p>
      )}

      <div className="mt-8 flex items-center justify-end gap-3 border-t border-line pt-5">
        <AnimatePresence>
          {salvo && (
            <motion.span
              role="status"
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="inline-flex items-center gap-1.5 text-base font-semibold text-ok"
            >
              <Check className="size-4" aria-hidden /> Salvo
            </motion.span>
          )}
        </AnimatePresence>
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
