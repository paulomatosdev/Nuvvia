"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Sparkles, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ComoCalculamos, DietaPlano } from "@/components/DietaPlano";
import { EASE_OUT, MOLA_LAYOUT, Numero } from "@/components/motion";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import {
  ATIVIDADES,
  CONDICOES,
  EXCLUI,
  GRUPOS,
  OBJETIVOS,
  RESTRICOES,
  TEMPOS,
} from "@/lib/questionario";
import { CondicaoSaude, Restricao, RespostasQuestionario, ResultadoQuestionario } from "@/lib/types";
import { useApi } from "@/lib/useApi";

export default function QuestionarioPage() {
  return (
    <AppShell area="paciente">
      <Questionario />
    </AppShell>
  );
}

type Rascunho = Omit<RespostasQuestionario, "sexo" | "nivel_atividade" | "objetivo" | "altura_cm" | "peso_kg" | "modo"> & {
  sexo: RespostasQuestionario["sexo"] | null;
  nivel_atividade: RespostasQuestionario["nivel_atividade"] | null;
  objetivo: RespostasQuestionario["objetivo"] | null;
  altura_cm: string;
  peso_kg: string;
};

const INICIAL: Rascunho = {
  sexo: null,
  data_nascimento: "",
  altura_cm: "",
  peso_kg: "",
  nivel_atividade: null,
  objetivo: null,
  refeicoes_por_dia: 4,
  tempo_cozinhar: "medio",
  restricoes: [],
  alergias: null,
  condicoes_saude: [],
  alimentos_preferidos: [],
  alimentos_evitados: [],
};

const ETAPAS = ["Sobre você", "Rotina", "Objetivo", "Saúde", "Alimentos", "Como montar"];

const alternar = <T,>(lista: T[], valor: T) =>
  lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];

// ---- Controles ----

function Cartao({
  selecionado,
  onClick,
  titulo,
  descricao,
  grupo,
}: {
  selecionado: boolean;
  onClick: () => void;
  titulo: string;
  descricao?: string;
  grupo: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selecionado}
      onClick={onClick}
      className={`relative w-full rounded-lg border px-4 py-3.5 text-left transition-colors duration-200 ${
        selecionado ? "border-ink bg-surface" : "border-line hover:border-ink/40"
      }`}
    >
      {selecionado && (
        <motion.span
          layoutId={`marca-${grupo}`}
          transition={MOLA_LAYOUT}
          className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-ink text-bg"
          aria-hidden
        >
          <Check className="size-3.5" strokeWidth={3} />
        </motion.span>
      )}
      <span className="block pr-8 text-base font-bold text-ink">{titulo}</span>
      {descricao && <span className="mt-0.5 block text-sm text-muted">{descricao}</span>}
    </button>
  );
}

function Segmentado<T extends string | number>({
  id,
  opcoes,
  valor,
  onChange,
}: {
  id: string;
  opcoes: { valor: T; label: string }[];
  valor: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-labelledby={id} className="flex gap-1 rounded-md border border-line p-1">
      {opcoes.map((o) => (
        <button
          key={String(o.valor)}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          onClick={() => onChange(o.valor)}
          className={`relative flex-1 rounded px-3 py-2 text-base font-semibold transition-colors ${
            valor === o.valor ? "text-bg" : "text-muted hover:text-ink"
          }`}
        >
          {valor === o.valor && (
            <motion.span layoutId={`seg-${id}`} transition={MOLA_LAYOUT} className="absolute inset-0 rounded bg-ink" />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-base font-semibold transition-colors duration-200 ${
        ativo ? "border-ink bg-ink text-bg" : "border-line text-ink hover:border-ink/40"
      }`}
    >
      {ativo && <Check className="size-4" strokeWidth={2.5} aria-hidden />}
      {children}
    </button>
  );
}

type EstadoAlimento = "neutro" | "gosto" | "evito";

function ChipAlimento({ nome, estado, onClick }: { nome: string; estado: EstadoAlimento; onClick: () => void }) {
  const estilos: Record<EstadoAlimento, string> = {
    neutro: "border-line text-ink hover:border-ink/40",
    gosto: "border-ok bg-ok/15 text-ink",
    evito: "border-alert bg-alert/10 text-muted line-through decoration-alert/60",
  };
  const rotulo = { neutro: "", gosto: ", gosto", evito: ", não como" }[estado];
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      aria-label={`${nome}${rotulo}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors duration-200 ${estilos[estado]}`}
    >
      {estado === "gosto" && <Check className="size-3.5 text-ok" strokeWidth={3} aria-hidden />}
      {estado === "evito" && <X className="size-3.5 text-alert" strokeWidth={3} aria-hidden />}
      {nome}
    </motion.button>
  );
}

function Pergunta({ id, titulo, ajuda, children }: { id: string; titulo: string; ajuda?: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 id={id} className="text-base font-bold text-ink">
        {titulo}
      </h3>
      {ajuda && <p className="mt-0.5 text-sm text-muted">{ajuda}</p>}
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

// ---- Fluxo ----

function Questionario() {
  const router = useRouter();
  const alimentos = useApi(api.alimentosDoQuestionario);
  const [etapa, setEtapa] = useState(0);
  const [direcao, setDirecao] = useState(1);
  const [r, setR] = useState<Rascunho>(INICIAL);
  const [modo, setModo] = useState<"app" | "nutricionista" | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoQuestionario | null>(null);

  const set = <K extends keyof Rascunho>(k: K, v: Rascunho[K]) => setR((prev) => ({ ...prev, [k]: v }));

  const bloqueadas = useMemo(() => new Set(r.restricoes.flatMap((x) => EXCLUI[x])), [r.restricoes]);
  const alimentosVisiveis = (alimentos.data ?? []).filter((a) => !a.etiquetas.some((e) => bloqueadas.has(e)));

  const altura = Number(r.altura_cm);
  const peso = Number(r.peso_kg);
  const podeAvancar = [
    Boolean(r.sexo && r.data_nascimento && altura >= 100 && altura <= 250 && peso >= 30 && peso <= 300),
    Boolean(r.nivel_atividade),
    Boolean(r.objetivo),
    true,
    true,
    Boolean(modo),
  ][etapa];

  function irPara(nova: number) {
    setDirecao(nova > etapa ? 1 : -1);
    setEtapa(nova);
    setErro(null);
  }

  function estadoAlimento(id: string): EstadoAlimento {
    if (r.alimentos_preferidos.includes(id)) return "gosto";
    if (r.alimentos_evitados.includes(id)) return "evito";
    return "neutro";
  }

  // Um toque: gosto. Dois: não como. Três: volta ao neutro.
  function ciclarAlimento(id: string) {
    const atual = estadoAlimento(id);
    setR((prev) => ({
      ...prev,
      alimentos_preferidos:
        atual === "neutro" ? [...prev.alimentos_preferidos, id] : prev.alimentos_preferidos.filter((x) => x !== id),
      alimentos_evitados:
        atual === "gosto" ? [...prev.alimentos_evitados, id] : prev.alimentos_evitados.filter((x) => x !== id),
    }));
  }

  async function enviar() {
    if (!modo || !r.sexo || !r.nivel_atividade || !r.objetivo) return;
    setEnviando(true);
    setErro(null);
    try {
      const visiveis = new Set(alimentosVisiveis.map((a) => a.id));
      const res = await api.responderQuestionario({
        ...r,
        sexo: r.sexo,
        nivel_atividade: r.nivel_atividade,
        objetivo: r.objetivo,
        altura_cm: altura,
        peso_kg: peso,
        alergias: r.alergias?.trim() || null,
        alimentos_preferidos: r.alimentos_preferidos.filter((id) => visiveis.has(id)),
        alimentos_evitados: r.alimentos_evitados.filter((id) => visiveis.has(id)),
        modo,
      });
      setResultado(res);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar suas respostas");
    } finally {
      setEnviando(false);
    }
  }

  if (resultado) return <Resultado resultado={resultado} onRefazer={() => { setResultado(null); irPara(0); }} />;

  const ultima = etapa === ETAPAS.length - 1;

  return (
    <div className="mx-auto max-w-2xl">
      <header>
        <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-ink">Vamos montar sua dieta</h1>
        <p className="mt-1 text-lg text-muted">
          Algumas perguntas sobre você, sua rotina e do que você gosta. Leva uns 3 minutos.
        </p>
      </header>

      <nav aria-label="Etapas do questionário" className="mt-6">
        <ol className="grid grid-cols-6 gap-1.5">
          {ETAPAS.map((nome, i) => (
            <li key={nome}>
              <span className="sr-only">
                Etapa {i + 1} de {ETAPAS.length}: {nome}
                {i === etapa ? " (atual)" : i < etapa ? " (concluída)" : ""}
              </span>
              <span className="block h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
                <motion.span
                  className="block h-full origin-left rounded-full bg-ink"
                  initial={false}
                  animate={{ scaleX: i <= etapa ? 1 : 0 }}
                  transition={{ duration: 0.45, ease: EASE_OUT }}
                />
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-2 font-mono text-sm text-muted" aria-hidden>
          {etapa + 1}/{ETAPAS.length} · {ETAPAS[etapa]}
        </p>
      </nav>

      <div className="relative mt-6 overflow-hidden">
        {/* Só a entrada é animada: a etapa nova desliza no sentido da navegação */}
          <motion.section
            key={etapa}
            initial={{ opacity: 0.35, x: direcao * 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            aria-label={ETAPAS[etapa]}
            className="space-y-7"
          >
            {etapa === 0 && (
              <>
                <Pergunta id="q-sexo" titulo="Sexo biológico" ajuda="Usado só no cálculo do gasto de energia do corpo.">
                  <Segmentado
                    id="q-sexo"
                    opcoes={[
                      { valor: "feminino", label: "Feminino" },
                      { valor: "masculino", label: "Masculino" },
                    ]}
                    valor={r.sexo}
                    onChange={(v) => set("sexo", v)}
                  />
                </Pergunta>
                <div className="grid gap-5 sm:grid-cols-3">
                  <label className="block">
                    <span className="rotulo mb-1.5 block text-muted">Nascimento</span>
                    <input
                      type="date"
                      required
                      max={new Date().toISOString().slice(0, 10)}
                      value={r.data_nascimento}
                      onChange={(e) => set("data_nascimento", e.target.value)}
                      className="campo"
                    />
                  </label>
                  <label className="block">
                    <span className="rotulo mb-1.5 block text-muted">Altura (cm)</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={100}
                      max={250}
                      placeholder="ex.: 165"
                      value={r.altura_cm}
                      onChange={(e) => set("altura_cm", e.target.value)}
                      className="campo font-mono"
                    />
                  </label>
                  <label className="block">
                    <span className="rotulo mb-1.5 block text-muted">Peso (kg)</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={30}
                      max={300}
                      step="0.1"
                      placeholder="ex.: 70"
                      value={r.peso_kg}
                      onChange={(e) => set("peso_kg", e.target.value)}
                      className="campo font-mono"
                    />
                  </label>
                </div>
              </>
            )}

            {etapa === 1 && (
              <>
                <Pergunta id="q-atividade" titulo="Quanto você se movimenta?">
                  <div role="radiogroup" aria-labelledby="q-atividade" className="grid gap-2">
                    {ATIVIDADES.map((a) => (
                      <Cartao
                        key={a.valor}
                        grupo="atividade"
                        selecionado={r.nivel_atividade === a.valor}
                        onClick={() => set("nivel_atividade", a.valor)}
                        titulo={a.label}
                        descricao={a.descricao}
                      />
                    ))}
                  </div>
                </Pergunta>
                <Pergunta id="q-refeicoes" titulo="Quantas refeições você faz por dia?">
                  <Segmentado
                    id="q-refeicoes"
                    opcoes={[3, 4, 5, 6].map((n) => ({ valor: n, label: String(n) }))}
                    valor={r.refeicoes_por_dia}
                    onChange={(v) => set("refeicoes_por_dia", v)}
                  />
                </Pergunta>
                <Pergunta id="q-tempo" titulo="Quanto tempo você tem para cozinhar?" ajuda="Com pouco tempo, priorizamos alimentos práticos.">
                  <Segmentado id="q-tempo" opcoes={TEMPOS} valor={r.tempo_cozinhar} onChange={(v) => set("tempo_cozinhar", v)} />
                </Pergunta>
              </>
            )}

            {etapa === 2 && (
              <Pergunta id="q-objetivo" titulo="Qual é o seu objetivo principal?">
                <div role="radiogroup" aria-labelledby="q-objetivo" className="grid gap-2 sm:grid-cols-2">
                  {OBJETIVOS.map((o) => (
                    <Cartao
                      key={o.valor}
                      grupo="objetivo"
                      selecionado={r.objetivo === o.valor}
                      onClick={() => set("objetivo", o.valor)}
                      titulo={o.label}
                      descricao={o.descricao}
                    />
                  ))}
                </div>
              </Pergunta>
            )}

            {etapa === 3 && (
              <>
                <Pergunta id="q-restricoes" titulo="Alguma restrição alimentar?" ajuda="Marque todas que valem para você.">
                  <div className="flex flex-wrap gap-2">
                    {RESTRICOES.map((x) => (
                      <Chip
                        key={x.valor}
                        ativo={r.restricoes.includes(x.valor)}
                        onClick={() => set("restricoes", alternar<Restricao>(r.restricoes, x.valor))}
                      >
                        {x.label}
                      </Chip>
                    ))}
                  </div>
                </Pergunta>
                <Pergunta
                  id="q-condicoes"
                  titulo="Alguma condição de saúde?"
                  ajuda="Se marcar alguma, recomendamos montar a dieta com uma nutricionista."
                >
                  <div className="flex flex-wrap gap-2">
                    {CONDICOES.map((x) => (
                      <Chip
                        key={x.valor}
                        ativo={r.condicoes_saude.includes(x.valor)}
                        onClick={() => set("condicoes_saude", alternar<CondicaoSaude>(r.condicoes_saude, x.valor))}
                      >
                        {x.label}
                      </Chip>
                    ))}
                  </div>
                </Pergunta>
                <label className="block">
                  <span className="mb-1.5 block text-base font-bold text-ink">Alergias (opcional)</span>
                  <input
                    maxLength={500}
                    value={r.alergias ?? ""}
                    onChange={(e) => set("alergias", e.target.value)}
                    placeholder="Ex.: amendoim, camarão"
                    className="campo"
                  />
                </label>
              </>
            )}

            {etapa === 4 && (
              <div>
                <h3 className="text-base font-bold text-ink">Do que você gosta?</h3>
                <p className="mt-0.5 text-base text-muted">
                  Toque uma vez no que você <b className="text-ok">gosta</b> e duas vezes no que você{" "}
                  <b className="text-alert">não come</b>. Montamos a dieta com o que você já come, porque é a dieta que
                  você consegue seguir que dá resultado.
                </p>
                <div className="mt-5 space-y-5">
                  {alimentos.loading && <div className="h-24 animate-pulse rounded-lg bg-line" />}
                  {GRUPOS.map((g) => {
                    const doGrupo = alimentosVisiveis.filter((a) => a.grupo === g.valor);
                    if (doGrupo.length === 0) return null;
                    return (
                      <div key={g.valor}>
                        <h4 className="rotulo mb-2 text-muted">{g.label}</h4>
                        <div className="flex flex-wrap gap-2">
                          {doGrupo.map((a) => (
                            <ChipAlimento
                              key={a.id}
                              nome={a.nome}
                              estado={estadoAlimento(a.id)}
                              onClick={() => ciclarAlimento(a.id)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {etapa === 5 && (
              <Pergunta id="q-modo" titulo="Como você quer montar sua dieta?">
                <div role="radiogroup" aria-labelledby="q-modo" className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      {
                        valor: "app",
                        Icone: Sparkles,
                        titulo: "Montar agora pelo app",
                        texto: "Calculamos suas metas e montamos um cardápio com os alimentos que você escolheu.",
                      },
                      {
                        valor: "nutricionista",
                        Icone: CalendarDays,
                        titulo: "Prefiro uma consulta",
                        texto: "Agende com uma nutricionista. Suas respostas já ficam com ela.",
                      },
                    ] as const
                  ).map(({ valor, Icone, titulo, texto }) => (
                    <button
                      key={valor}
                      type="button"
                      role="radio"
                      aria-checked={modo === valor}
                      onClick={() => setModo(valor)}
                      className={`relative flex flex-col gap-3 rounded-lg border p-5 text-left transition-colors duration-200 ${
                        modo === valor ? "border-ink bg-surface" : "border-line hover:border-ink/40"
                      }`}
                    >
                      <Icone className="size-6 text-ink" strokeWidth={1.75} aria-hidden />
                      <span className="text-lg font-bold text-ink">{titulo}</span>
                      <span className="text-base text-muted">{texto}</span>
                      {modo === valor && (
                        <motion.span
                          layoutId="marca-modo"
                          transition={MOLA_LAYOUT}
                          className="absolute right-4 top-4 grid size-5 place-items-center rounded-full bg-ink text-bg"
                          aria-hidden
                        >
                          <Check className="size-3.5" strokeWidth={3} />
                        </motion.span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted">
                  O plano do app é um ponto de partida e não substitui o acompanhamento de uma nutricionista.
                </p>
              </Pergunta>
            )}
          </motion.section>

      </div>

      {erro && (
        <p role="alert" className="mt-5 text-base text-alert">
          {erro}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
        {etapa > 0 ? (
          <Button variant="quiet" onClick={() => irPara(etapa - 1)}>
            <ArrowLeft className="size-4" aria-hidden />
            Voltar
          </Button>
        ) : (
          <Button variant="quiet" onClick={() => router.push("/minha-area")}>
            Fazer depois
          </Button>
        )}
        {ultima ? (
          <Button onClick={enviar} disabled={!podeAvancar || enviando}>
            {enviando ? "Montando…" : modo === "nutricionista" ? "Concluir" : "Montar minha dieta"}
          </Button>
        ) : (
          <Button onClick={() => irPara(etapa + 1)} disabled={!podeAvancar}>
            Continuar
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
}

// ---- Resultado ----

function Resultado({ resultado, onRefazer }: { resultado: ResultadoQuestionario; onRefazer: () => void }) {
  if (resultado.recomendacao_consulta || !resultado.dieta || !resultado.metas) {
    return (
      <motion.div
        initial={{ opacity: 0.35, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="mx-auto max-w-xl"
      >
        <CalendarDays className="size-8 text-ink" strokeWidth={1.75} aria-hidden />
        <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.02em] text-ink">Vamos marcar sua consulta</h1>
        <p className="mt-2 text-lg text-muted">
          {resultado.motivo ??
            "Suas respostas foram salvas e ficam disponíveis para a nutricionista que atender você."}
        </p>
        {resultado.motivo && (
          <p className="mt-2 text-base text-muted">Suas respostas foram salvas para a nutricionista.</p>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/minhas-consultas?agendar=1"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-ink px-4 text-base font-semibold text-bg transition-colors hover:bg-ink/85"
          >
            Agendar consulta
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Button variant="ghost" onClick={onRefazer}>
            Rever respostas
          </Button>
        </div>
      </motion.div>
    );
  }

  const { metas, dieta } = resultado;
  const numeros = [
    { label: "Calorias", valor: metas.calorias, unidade: "kcal" },
    { label: "Proteína", valor: metas.proteina_g, unidade: "g" },
    { label: "Carboidrato", valor: metas.carboidratos_g, unidade: "g" },
    { label: "Gordura", valor: metas.gordura_g, unidade: "g" },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-ink">Sua dieta está pronta</h1>
        <p className="mt-1 text-lg text-muted">Metas por dia, calculadas a partir das suas respostas.</p>
      </header>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
        {numeros.map((n) => (
          <div key={n.label} className="bg-bg px-4 py-3">
            <dt className="rotulo text-muted">{n.label}</dt>
            <dd className="mt-1 font-mono text-2xl font-bold text-ink">
              <Numero valor={n.valor} />
              <span className="ml-1 text-sm font-medium text-muted">{n.unidade}</span>
            </dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="cardapio" className="mt-8">
        <h2 id="cardapio" className="text-xl font-bold text-ink">
          Cardápio do dia
        </h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-line">
          <DietaPlano dieta={dieta} />
        </div>
      </section>

      {dieta.explicacao && (
        <div className="mt-6">
          <ComoCalculamos explicacao={dieta.explicacao} referencias={resultado.referencias} />
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/minha-area"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-ink px-4 text-base font-semibold text-bg transition-colors hover:bg-ink/85"
        >
          Ir para minha área
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link
          href="/minhas-consultas?agendar=1"
          className="inline-flex h-10 items-center rounded-md border border-line px-4 text-base font-semibold text-ink transition-colors hover:border-ink/40"
        >
          Quero revisar com uma nutricionista
        </Link>
        <Button variant="quiet" onClick={onRefazer}>
          Refazer questionário
        </Button>
      </div>
    </div>
  );
}
