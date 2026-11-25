"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "./ui/Button";

const CAMPOS_MACRO = [
  { id: "calorias", rotulo: "Calorias", unidade: "kcal" },
  { id: "proteina_g", rotulo: "Proteína", unidade: "g" },
  { id: "carboidratos_g", rotulo: "Carboidrato", unidade: "g" },
  { id: "gordura_g", rotulo: "Gordura", unidade: "g" },
] as const;

type Macros = Record<(typeof CAMPOS_MACRO)[number]["id"], string>;

const VAZIO: Macros = { calorias: "", proteina_g: "", carboidratos_g: "", gordura_g: "" };

/** Lançamento manual de uma refeição pelo paciente. */
export function RegistrarRefeicaoForm({ onSalva, onCancel }: { onSalva: () => void; onCancel: () => void }) {
  const [descricao, setDescricao] = useState("");
  const [macros, setMacros] = useState<Macros>(VAZIO);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      await api.registrarRefeicao({
        descricao: descricao.trim(),
        calorias: Number(macros.calorias || 0),
        proteina_g: Number(macros.proteina_g || 0),
        carboidratos_g: Number(macros.carboidratos_g || 0),
        gordura_g: Number(macros.gordura_g || 0),
      });
      setDescricao("");
      setMacros(VAZIO);
      onSalva();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível registrar a refeição");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="rounded-lg border border-line bg-surface p-5">
      <h2 className="mb-4 text-lg font-bold text-ink">Registrar refeição</h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-4">
          <label htmlFor="descricao" className="rotulo mb-1.5 block text-muted">
            O que você comeu
          </label>
          <input
            id="descricao"
            required
            maxLength={1000}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex.: arroz, feijão, frango grelhado e salada"
            className="campo"
          />
        </div>
        {CAMPOS_MACRO.map(({ id, rotulo, unidade }) => (
          <div key={id}>
            <label htmlFor={id} className="rotulo mb-1.5 block text-muted">
              {rotulo} ({unidade})
            </label>
            <input
              id={id}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              required={id === "calorias"}
              value={macros[id]}
              onChange={(e) => setMacros((m) => ({ ...m, [id]: e.target.value }))}
              className="campo font-mono"
            />
          </div>
        ))}
      </div>
      {erro && (
        <p role="alert" className="mt-4 text-base text-alert">
          {erro}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando…" : "Registrar"}
        </Button>
      </div>
    </form>
  );
}
