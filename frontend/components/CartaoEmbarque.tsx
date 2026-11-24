"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, MapPin, Video } from "lucide-react";
import { hora, macrosDe, numero, rotuloDia } from "@/lib/format";
import { Consulta, DiaAdesao, PacientePainel } from "@/lib/types";
import { Barra, EASE_OUT, Numero } from "./motion";

const DIA_SEMANA = new Intl.DateTimeFormat("pt-BR", { weekday: "narrow" });
const DIA_LONGO = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric", month: "numeric" });

function idade(nascimento: string | null) {
  if (!nascimento) return null;
  const n = new Date(`${nascimento}T12:00:00`);
  const hoje = new Date();
  let anos = hoje.getFullYear() - n.getFullYear();
  if (hoje < new Date(hoje.getFullYear(), n.getMonth(), n.getDate())) anos -= 1;
  return anos;
}

const segmento = {
  hidden: { opacity: 0.35, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

function Campo({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="rotulo text-pass-muted">{rotulo}</dt>
      <dd className="mt-0.5 text-lg font-semibold leading-snug text-pass-ink [overflow-wrap:break-word] hyphens-auto">{valor}</dd>
    </div>
  );
}

function CelulaDia({ dia }: { dia: DiaAdesao }) {
  const data = new Date(`${dia.data}T12:00:00`);
  const semRegistro = dia.calorias === 0;
  const estado = semRegistro ? "sem registro" : dia.na_meta ? "na meta" : dia.na_meta === false ? "fora da meta" : "";
  const estilo = semRegistro
    ? "border border-dashed border-pass-line"
    : dia.na_meta
      ? "bg-pass-ok"
      : dia.na_meta === false
        ? "border-2 border-pass-alert bg-pass-alert/15"
        : "bg-pass-muted/40";
  return (
    <li className="flex flex-col items-center gap-1.5" title={`${DIA_LONGO.format(data)}: ${numero(dia.calorias)} kcal`}>
      <span className={`h-9 w-full rounded-sm ${estilo}`} aria-hidden />
      <span className="text-xs font-semibold uppercase text-pass-muted" aria-hidden>
        {DIA_SEMANA.format(data)}
      </span>
      <span className="sr-only">
        {DIA_LONGO.format(data)}: {numero(dia.calorias)} kcal, {estado}
      </span>
    </li>
  );
}

/**
 * Cartão de embarque do paciente: identificação, hoje vs. meta e a semana.
 * É sempre o inverso do painel (claro no tema escuro, escuro no tema claro).
 */
export function CartaoEmbarque({
  paciente,
  consulta,
  largo = false,
  linkFicha = false,
}: {
  paciente: PacientePainel;
  consulta?: Consulta | null;
  largo?: boolean;
  linkFicha?: boolean;
}) {
  const macros = macrosDe(paciente.macros_hoje);
  const anos = idade(paciente.data_nascimento);
  const quando = consulta?.agendamento_data ?? paciente.proxima_consulta;
  const online = consulta?.tipo_consulta === "online";

  const linhaConsulta = quando
    ? `${consulta ? "Consulta" : "Próxima consulta"} ${rotuloDia(quando).toLowerCase()}, ${hora(quando)}`
    : "Sem consulta marcada";

  const reduzir = useReducedMotion();
  const segmentoClasse = largo ? "px-6 py-6 lg:px-7" : "px-6 py-5";

  return (
    <motion.article
      key={paciente.id}
      aria-label={`Cartão de ${paciente.nome_completo}`}
      initial={reduzir ? false : { clipPath: "inset(0 0 100% 0 round 14px)" }}
      animate={{ clipPath: "inset(0 0 0% 0 round 14px)" }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
      className="rounded-[14px] bg-pass text-pass-ink shadow-pass"
    >
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}
        className={largo ? "grid lg:grid-cols-[1.1fr_1.3fr_1fr]" : ""}
      >
        {/* Identificação */}
        <motion.section
          variants={segmento}
          className={`${largo ? "picote lg:bg-none lg:before:hidden lg:after:hidden" : "picote"} ${segmentoClasse}`}
        >
          <h2 className={`font-extrabold leading-tight tracking-[-0.02em] ${largo ? "text-4xl" : "text-3xl"}`}>
            {paciente.nome_completo}
          </h2>
          <p className="mt-1.5 flex items-center gap-2 text-base text-pass-muted">
            {consulta &&
              (online ? <Video className="size-4" aria-hidden /> : <MapPin className="size-4" aria-hidden />)}
            {linhaConsulta}
          </p>
          <dl className="mt-5 grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4">
            <Campo rotulo="Objetivo" valor={paciente.meta ?? "—"} />
            <Campo
              rotulo="Peso"
              valor={paciente.peso_kg ? <span className="font-mono">{numero(paciente.peso_kg)} kg</span> : "—"}
            />
            <Campo rotulo="Idade" valor={anos !== null ? <span className="font-mono">{anos} anos</span> : "—"} />
          </dl>
        </motion.section>

        {/* Hoje vs. meta */}
        <motion.section
          variants={segmento}
          className={`picote ${largo ? "lg:border-x lg:border-dashed lg:border-pass-line lg:bg-none lg:before:hidden lg:after:hidden" : ""} ${segmentoClasse}`}
          aria-labelledby={`hoje-${paciente.id}`}
        >
          <h3 id={`hoje-${paciente.id}`} className="rotulo text-pass-muted">
            Hoje vs. meta
          </h3>
          <ul className="mt-3 space-y-3">
            {macros.map((m, i) => {
              const pct = m.target ? Math.round((m.consumed / m.target) * 100) : null;
              const acima = pct !== null && pct > 110;
              return (
                <li key={m.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className={i === 0 ? "text-lg font-bold" : "text-base font-semibold"}>{m.label}</span>
                    <span className="font-mono text-sm text-pass-muted">
                      <Numero valor={m.consumed} className="font-bold text-pass-ink" />
                      {m.target ? ` / ${numero(m.target)} ${m.unit}` : ` ${m.unit} · sem meta`}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <Barra
                      pct={pct ?? 0}
                      className="flex-1"
                      trilho="bg-pass-line/70"
                      preenchimento={acima ? "bg-pass-alert" : "bg-pass-ink"}
                      atraso={0.25 + i * 0.06}
                    />
                    <span className={`w-11 text-right font-mono text-sm font-bold ${acima ? "text-pass-alert" : ""}`}>
                      {pct === null ? "—" : <Numero valor={pct} sufixo="%" />}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </motion.section>

        {/* Semana */}
        <motion.section variants={segmento} className={segmentoClasse} aria-labelledby={`semana-${paciente.id}`}>
          <div className="flex items-baseline justify-between gap-3">
            <h3 id={`semana-${paciente.id}`} className="rotulo text-pass-muted">
              Adesão · 7 dias
            </h3>
            <span className="font-mono text-2xl font-bold">
              {paciente.adesao_7d === null ? "—" : <Numero valor={paciente.adesao_7d} sufixo="%" />}
            </span>
          </div>
          {paciente.adesao_7d === null ? (
            <p className="mt-3 text-base text-pass-muted">Sem meta calórica definida para medir a adesão.</p>
          ) : (
            <ol className="mt-3 grid grid-cols-7 gap-1.5" aria-label="Dias dentro da meta calórica">
              {paciente.semana.map((d) => (
                <CelulaDia key={d.data} dia={d} />
              ))}
            </ol>
          )}
          <p className="mt-3 text-sm text-pass-muted">Dia na meta: calorias a até 10% do alvo.</p>
          {linkFicha && (
            <Link
              href={`/pacientes/${paciente.id}`}
              className="group/link mt-4 inline-flex items-center gap-2 text-base font-bold text-pass-ink"
            >
              Abrir ficha completa
              <ArrowRight
                className="size-4 transition-transform duration-200 ease-out group-hover/link:translate-x-1"
                aria-hidden
              />
            </Link>
          )}
        </motion.section>
      </motion.div>
    </motion.article>
  );
}
