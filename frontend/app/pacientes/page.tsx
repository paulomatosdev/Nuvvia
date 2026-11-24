"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Estado } from "@/components/Estado";
import { Barra, cascata } from "@/components/motion";
import { api } from "@/lib/api";
import { hora, numero, rotuloDia } from "@/lib/format";
import { PacientePainel } from "@/lib/types";
import { useApi } from "@/lib/useApi";

export default function PatientsPage() {
  return (
    <AppShell>
      <Pacientes />
    </AppShell>
  );
}

type Ordem = "nome" | "adesao" | "proxima";

const COLUNAS =
  "grid-cols-[minmax(0,1fr)_5rem] lg:grid-cols-[minmax(12rem,1fr)_8rem_10rem_5rem] xl:grid-cols-[minmax(14rem,1.4fr)_minmax(0,1fr)_9rem_10rem_6rem]";

function pctCalorias(p: PacientePainel) {
  const meta = p.macros_hoje.meta_calorias;
  return meta ? Math.round((p.macros_hoje.calorias_consumidas / meta) * 100) : null;
}

function Pacientes() {
  const { data, loading, error, reload } = useApi(api.pacientes);
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<{ campo: Ordem; asc: boolean }>({ campo: "nome", asc: true });

  const termo = busca.trim().toLowerCase();
  const lista = useMemo(() => {
    const filtrados = (data ?? []).filter(
      (p) => !termo || p.nome_completo.toLowerCase().includes(termo) || p.email.toLowerCase().includes(termo)
    );
    const valor = (p: PacientePainel) =>
      ordem.campo === "nome"
        ? p.nome_completo
        : ordem.campo === "adesao"
          ? (p.adesao_7d ?? -1)
          : p.proxima_consulta
            ? new Date(p.proxima_consulta).getTime()
            : Number.MAX_SAFE_INTEGER;
    return [...filtrados].sort((a, b) => {
      const va = valor(a);
      const vb = valor(b);
      const cmp = typeof va === "string" ? va.localeCompare(vb as string, "pt-BR") : va - (vb as number);
      return ordem.asc ? cmp : -cmp;
    });
  }, [data, termo, ordem]);

  function ordenarPor(campo: Ordem) {
    setOrdem((o) => (o.campo === campo ? { campo, asc: !o.asc } : { campo, asc: campo !== "adesao" }));
  }

  function Cabecalho({ campo, children, className = "" }: { campo?: Ordem; children: React.ReactNode; className?: string }) {
    if (!campo) return <span className={className}>{children}</span>;
    const ativo = ordem.campo === campo;
    const Seta = ordem.asc ? ArrowUp : ArrowDown;
    return (
      <button
        type="button"
        onClick={() => ordenarPor(campo)}
        title="Ordenar"
        className={`inline-flex items-center gap-1 uppercase tracking-[0.14em] transition-colors hover:text-ink ${
          ativo ? "text-ink" : ""
        } ${className}`}
      >
        {children}
        {ativo && <Seta className="size-3.5" aria-hidden />}
      </button>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-ink">Pacientes</h1>
        <label className="relative block w-full sm:w-72">
          <span className="sr-only">Buscar paciente</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou e-mail"
            className="campo pl-9"
          />
        </label>
      </header>

      <section aria-label="Lista de pacientes" className="mt-6 rounded-lg border border-line pt-3">
        <div className={`rotulo grid gap-x-4 border-b border-line px-4 pb-2 text-muted ${COLUNAS}`}>
          <Cabecalho campo="nome">Paciente</Cabecalho>
          <Cabecalho className="hidden xl:inline">Objetivo</Cabecalho>
          <Cabecalho campo="proxima" className="hidden lg:inline-flex">
            Próxima
          </Cabecalho>
          <Cabecalho className="hidden lg:inline">Hoje</Cabecalho>
          <Cabecalho campo="adesao" className="justify-self-end">
            Adesão
          </Cabecalho>
        </div>

        <Estado
          loading={loading}
          error={error}
          onRetry={reload}
          vazio={lista.length === 0}
          mensagemVazio={
            termo
              ? "Nenhum paciente encontrado para essa busca."
              : "Você ainda não tem pacientes. Eles aparecem aqui depois da primeira consulta ou dieta."
          }
        >
          <motion.ul
            key={`${ordem.campo}-${ordem.asc}-${termo}`}
            variants={cascata.container}
            initial="hidden"
            animate="show"
            className="divide-y divide-line"
          >
            {lista.map((p) => {
              const pct = pctCalorias(p);
              const baixa = p.adesao_7d !== null && p.adesao_7d < 80;
              return (
                <motion.li key={p.id} variants={cascata.item}>
                  <Link
                    href={`/pacientes/${p.id}`}
                    className={`grid items-center gap-x-4 px-4 py-3.5 transition-colors hover:bg-surface/70 ${COLUNAS}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-lg font-semibold text-ink">{p.nome_completo}</span>
                      <span className="block truncate text-sm text-muted">{p.email}</span>
                    </span>
                    <span className="hidden truncate text-base text-muted xl:block">{p.meta ?? "—"}</span>
                    <span className="hidden text-base lg:block">
                      {p.proxima_consulta ? (
                        <>
                          <span className="block text-ink">{rotuloDia(p.proxima_consulta)}</span>
                          <span className="font-mono text-sm text-muted">{hora(p.proxima_consulta)}</span>
                        </>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </span>
                    <span className="hidden lg:block">
                      {pct === null ? (
                        <span className="text-sm text-muted">sem meta</span>
                      ) : (
                        <>
                          <span className="flex justify-between font-mono text-sm">
                            <span className="text-ink">{numero(p.macros_hoje.calorias_consumidas)} kcal</span>
                            <span className="text-muted">{pct}%</span>
                          </span>
                          <Barra pct={pct} className="mt-1.5" preenchimento={pct > 110 ? "bg-alert" : "bg-ink"} />
                        </>
                      )}
                    </span>
                    <span
                      className={`justify-self-end font-mono text-xl font-bold ${
                        p.adesao_7d === null ? "text-muted" : baixa ? "text-alert" : "text-ok"
                      }`}
                    >
                      {p.adesao_7d === null ? "—" : `${p.adesao_7d}%`}
                    </span>
                  </Link>
                </motion.li>
              );
            })}
          </motion.ul>
        </Estado>
      </section>
    </div>
  );
}
