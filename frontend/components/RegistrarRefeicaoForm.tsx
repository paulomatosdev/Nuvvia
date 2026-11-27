"use client";

import { useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { numero } from "@/lib/format";
import { AlimentoCatalogo } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { EASE_OUT } from "./motion";
import { Button } from "./ui/Button";

type ItemForm = {
  chave: number;
  alimento: AlimentoCatalogo;
  quantidade: string;
  /** "g" ou o índice da medida caseira escolhida */
  unidade: string;
};

/** Remove acentos e caixa para a busca: "acai" encontra "Açaí". */
const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function gramasDo(item: ItemForm) {
  const q = Number(item.quantidade.replace(",", "."));
  if (!Number.isFinite(q) || q <= 0) return 0;
  if (item.unidade === "g") return q;
  const medida = item.alimento.medidas[Number(item.unidade)];
  return medida ? q * medida.gramas : 0;
}

function macrosDo(a: AlimentoCatalogo, gramas: number) {
  const f = gramas / 100;
  return { kcal: a.kcal * f, proteina: a.proteina * f, carboidrato: a.carboidrato * f, gordura: a.gordura * f };
}

/** Busca de alimentos em formato combobox (setas + Enter para escolher). */
function BuscaAlimento({ catalogo, onEscolher }: { catalogo: AlimentoCatalogo[]; onEscolher: (a: AlimentoCatalogo) => void }) {
  const id = useId();
  const [texto, setTexto] = useState("");
  const [ativo, setAtivo] = useState(0);
  const [aberto, setAberto] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  const resultados = useMemo(() => {
    const termo = normalizar(texto.trim());
    if (!termo) return [];
    const palavras = termo.split(/\s+/);
    return catalogo
      .filter((a) => palavras.every((p) => normalizar(a.nome).includes(p)))
      .sort((a, b) => Number(!normalizar(a.nome).startsWith(termo)) - Number(!normalizar(b.nome).startsWith(termo)))
      .slice(0, 8);
  }, [texto, catalogo]);

  function escolher(a: AlimentoCatalogo) {
    onEscolher(a);
    setTexto("");
    setAberto(false);
    entrada.current?.focus();
  }

  function aoTeclar(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!resultados.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAtivo((i) => (i + 1) % resultados.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((i) => (i - 1 + resultados.length) % resultados.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      escolher(resultados[ativo]);
    } else if (e.key === "Escape") {
      setAberto(false);
    }
  }

  const mostrar = aberto && texto.trim().length > 0;

  return (
    <div className="relative">
      <label htmlFor={`${id}-busca`} className="rotulo mb-1.5 block text-muted">
        Adicionar alimento
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          ref={entrada}
          id={`${id}-busca`}
          role="combobox"
          aria-expanded={mostrar}
          aria-controls={`${id}-lista`}
          aria-activedescendant={mostrar && resultados[ativo] ? `${id}-op-${resultados[ativo].id}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setAtivo(0);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          onBlur={() => window.setTimeout(() => setAberto(false), 120)}
          onKeyDown={aoTeclar}
          placeholder="Busque: arroz, frango, banana…"
          className="campo pl-9"
        />
      </div>
      <AnimatePresence>
        {mostrar && (
          <motion.ul
            id={`${id}-lista`}
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-md border border-line bg-surface py-1 shadow-pass"
          >
            {resultados.length === 0 ? (
              <li className="px-3 py-2.5 text-base text-muted">Nenhum alimento encontrado. Use o lançamento manual.</li>
            ) : (
              resultados.map((a, i) => (
                <li
                  key={a.id}
                  id={`${id}-op-${a.id}`}
                  role="option"
                  aria-selected={i === ativo}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    escolher(a);
                  }}
                  onMouseEnter={() => setAtivo(i)}
                  className={`flex cursor-pointer items-baseline justify-between gap-3 px-3 py-2 ${
                    i === ativo ? "bg-bg" : ""
                  }`}
                >
                  <span className="text-base text-ink">{a.nome}</span>
                  <span className="shrink-0 font-mono text-xs text-muted">{numero(a.kcal)} kcal/100 g</span>
                </li>
              ))
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Registro de refeição: alimentos + quantidades, com macros calculados automaticamente. */
export function RegistrarRefeicaoForm({ onSalva, onCancel }: { onSalva: () => void; onCancel: () => void }) {
  const catalogo = useApi(api.catalogoDeAlimentos);
  const [nome, setNome] = useState("");
  const [itens, setItens] = useState<ItemForm[]>([]);
  const [manual, setManual] = useState(false);
  const [manualDados, setManualDados] = useState({ descricao: "", calorias: "", proteina_g: "", carboidratos_g: "", gordura_g: "" });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const proximaChave = useRef(0);

  function adicionar(a: AlimentoCatalogo) {
    // Começa pela medida caseira quando existe (ex.: 1 unidade), senão 100 g
    const temMedida = a.medidas.length > 0;
    setItens((prev) => [
      ...prev,
      { chave: proximaChave.current++, alimento: a, quantidade: temMedida ? "1" : "100", unidade: temMedida ? "0" : "g" },
    ]);
  }

  const atualizar = (chave: number, campo: "quantidade" | "unidade", valor: string) =>
    setItens((prev) => prev.map((i) => (i.chave === chave ? { ...i, [campo]: valor } : i)));

  const linhas = itens.map((i) => {
    const gramas = gramasDo(i);
    return { item: i, gramas, macros: macrosDo(i.alimento, gramas) };
  });
  const total = linhas.reduce(
    (acc, l) => ({
      kcal: acc.kcal + l.macros.kcal,
      proteina: acc.proteina + l.macros.proteina,
      carboidrato: acc.carboidrato + l.macros.carboidrato,
      gordura: acc.gordura + l.macros.gordura,
    }),
    { kcal: 0, proteina: 0, carboidrato: 0, gordura: 0 }
  );
  const valido = manual
    ? manualDados.descricao.trim() && Number(manualDados.calorias) >= 0 && manualDados.calorias !== ""
    : linhas.length > 0 && linhas.every((l) => l.gramas > 0);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!valido) return;
    setErro(null);
    setSalvando(true);
    try {
      if (manual) {
        await api.registrarRefeicao({
          descricao: manualDados.descricao.trim(),
          calorias: Number(manualDados.calorias || 0),
          proteina_g: Number(manualDados.proteina_g || 0),
          carboidratos_g: Number(manualDados.carboidratos_g || 0),
          gordura_g: Number(manualDados.gordura_g || 0),
        });
      } else {
        await api.registrarRefeicaoPorItens({
          nome: nome.trim() || null,
          itens: linhas.map((l) => ({ alimento_id: l.item.alimento.id, gramas: Math.round(l.gramas * 10) / 10 })),
        });
      }
      onSalva();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível registrar a refeição");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="rounded-lg border border-line bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">Registrar refeição</h2>
        <button
          type="button"
          onClick={() => setManual((v) => !v)}
          className="text-sm font-semibold text-muted underline hover:text-ink"
        >
          {manual ? "Escolher alimentos da lista" : "Lançar calorias manualmente"}
        </button>
      </div>

      {manual ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className="col-span-2 block sm:col-span-4">
            <span className="rotulo mb-1.5 block text-muted">O que você comeu</span>
            <input
              required
              maxLength={1000}
              value={manualDados.descricao}
              onChange={(e) => setManualDados((d) => ({ ...d, descricao: e.target.value }))}
              className="campo"
            />
          </label>
          {(
            [
              ["calorias", "Calorias (kcal)"],
              ["proteina_g", "Proteína (g)"],
              ["carboidratos_g", "Carboidrato (g)"],
              ["gordura_g", "Gordura (g)"],
            ] as const
          ).map(([campo, rotulo]) => (
            <label key={campo} className="block">
              <span className="rotulo mb-1.5 block text-muted">{rotulo}</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                required={campo === "calorias"}
                value={manualDados[campo]}
                onChange={(e) => setManualDados((d) => ({ ...d, [campo]: e.target.value }))}
                className="campo font-mono"
              />
            </label>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
            <label className="block">
              <span className="rotulo mb-1.5 block text-muted">Refeição (opcional)</span>
              <input
                maxLength={60}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Almoço"
                className="campo"
              />
            </label>
            <BuscaAlimento catalogo={catalogo.data ?? []} onEscolher={adicionar} />
          </div>

          {itens.length > 0 && (
            <div className="mt-5 overflow-hidden rounded-md border border-line">
              <ul className="divide-y divide-line">
                <AnimatePresence initial={false}>
                  {linhas.map(({ item, gramas, macros }) => (
                    <motion.li
                      key={item.chave}
                      layout="position"
                      initial={{ opacity: 0.35, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: EASE_OUT }}
                      className="overflow-hidden bg-bg"
                    >
                      <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-3 py-3 sm:grid-cols-[1fr_11rem_7rem_auto]">
                        <span className="min-w-0 text-base font-semibold text-ink">{item.alimento.nome}</span>
                        <button
                          type="button"
                          onClick={() => setItens((prev) => prev.filter((i) => i.chave !== item.chave))}
                          aria-label={`Remover ${item.alimento.nome}`}
                          className="row-start-1 grid size-8 place-items-center justify-self-end rounded text-muted hover:bg-surface hover:text-ink sm:col-start-4"
                        >
                          <X className="size-4" aria-hidden />
                        </button>
                        <div className="col-span-2 flex gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                          <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="any"
                            aria-label={`Quantidade de ${item.alimento.nome}`}
                            value={item.quantidade}
                            onChange={(e) => atualizar(item.chave, "quantidade", e.target.value)}
                            className="campo w-20 px-2 py-2 font-mono"
                          />
                          <select
                            aria-label={`Unidade de ${item.alimento.nome}`}
                            value={item.unidade}
                            onChange={(e) => atualizar(item.chave, "unidade", e.target.value)}
                            className="campo min-w-0 flex-1 px-2 py-2"
                          >
                            <option value="g">gramas</option>
                            {item.alimento.medidas.map((m, i) => (
                              <option key={m.nome} value={String(i)}>
                                {m.nome} ({numero(m.gramas)} g)
                              </option>
                            ))}
                          </select>
                        </div>
                        <span className="col-span-2 font-mono text-sm text-muted sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:text-right">
                          <b className="text-ink">{numero(macros.kcal)} kcal</b>
                          <span className="block">
                            {item.unidade !== "g" && gramas > 0 ? `${numero(gramas)} g · ` : ""}P {numero(macros.proteina)} g
                          </span>
                        </span>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              <dl className="grid grid-cols-4 gap-px border-t border-line bg-line">
                {(
                  [
                    ["Calorias", total.kcal, "kcal"],
                    ["Proteína", total.proteina, "g"],
                    ["Carboidrato", total.carboidrato, "g"],
                    ["Gordura", total.gordura, "g"],
                  ] as const
                ).map(([rotulo, valor, unidade]) => (
                  <div key={rotulo} className="bg-surface px-3 py-2.5">
                    <dt className="rotulo text-muted">{rotulo}</dt>
                    <dd className="mt-0.5 font-mono text-lg font-bold text-ink">
                      {numero(valor)}
                      <span className="ml-1 text-xs font-medium text-muted">{unidade}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <p className="mt-3 text-sm text-muted">
            Valores de referência da Tabela Brasileira de Composição de Alimentos (TACO) e da USDA, por 100 g.
          </p>
        </>
      )}

      {erro && (
        <p role="alert" className="mt-4 text-base text-alert">
          {erro}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={salvando || !valido}>
          {salvando ? "Salvando…" : "Registrar"}
        </Button>
      </div>
    </form>
  );
}
