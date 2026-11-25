"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Utensils } from "lucide-react";
import { AppShell, useUsuario } from "@/components/AppShell";
import { CartaoEmbarque } from "@/components/CartaoEmbarque";
import { Estado } from "@/components/Estado";
import { cascata, EASE_OUT } from "@/components/motion";
import { RegistrarRefeicaoForm } from "@/components/RegistrarRefeicaoForm";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { dataPorExtenso, hora, numero, primeiroNome, saudacao } from "@/lib/format";
import { useApi } from "@/lib/useApi";

export default function MinhaAreaPage() {
  return (
    <AppShell area="paciente">
      <MinhaArea />
    </AppShell>
  );
}

function MinhaArea() {
  const usuario = useUsuario();
  const painel = useApi(api.meuPainel);
  const refeicoes = useApi(api.refeicoesDeHoje);
  const dietas = useApi(() => api.dietasDoPaciente(usuario.id), [usuario.id]);
  const [registrando, setRegistrando] = useState(false);

  const dietaAtiva = (dietas.data ?? []).find((d) => d.ativo) ?? null;

  function aoRegistrar() {
    setRegistrando(false);
    refeicoes.reload();
    painel.reload();
  }

  return (
    <div className="mx-auto max-w-[1300px]">
      <header>
        <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-ink">
          {saudacao()}, {primeiroNome(usuario.nome_completo)}
        </h1>
        <p className="mt-1 text-lg text-muted">{dataPorExtenso()}.</p>
      </header>

      <div className="mt-6 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="order-2 min-w-0 space-y-10 xl:order-1">
          <section aria-labelledby="refeicoes">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="refeicoes" className="text-xl font-bold text-ink">
                Refeições de hoje
              </h2>
              {!registrando && (
                <Button onClick={() => setRegistrando(true)}>
                  <Plus className="size-4" strokeWidth={2.5} aria-hidden />
                  Registrar refeição
                </Button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {registrando && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: EASE_OUT }}
                  className="overflow-hidden"
                >
                  <div className="pt-4">
                    <RegistrarRefeicaoForm onSalva={aoRegistrar} onCancel={() => setRegistrando(false)} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 overflow-hidden rounded-lg border border-line">
              <Estado
                loading={refeicoes.loading}
                error={refeicoes.error}
                onRetry={refeicoes.reload}
                linhas={2}
                vazio={(refeicoes.data ?? []).length === 0}
                mensagemVazio="Nenhuma refeição registrada hoje."
              >
                <motion.ul variants={cascata.container} initial="hidden" animate="show" className="divide-y divide-line">
                  {(refeicoes.data ?? []).map((r) => (
                    <motion.li
                      key={r.id}
                      variants={cascata.item}
                      className="grid grid-cols-[4.25rem_1fr] items-start gap-x-4 px-4 py-3.5 sm:grid-cols-[4.25rem_1fr_auto]"
                    >
                      <span className="font-mono text-lg font-bold text-ink">{hora(r.registro_data)}</span>
                      <span className="min-w-0">
                        <span className="block text-base font-semibold text-ink">{r.descricao}</span>
                        <span className="block font-mono text-sm text-muted">
                          P {numero(r.proteina_g)}g · C {numero(r.carboidratos_g)}g · G {numero(r.gordura_g)}g
                        </span>
                      </span>
                      <span className="col-start-2 font-mono text-base font-bold text-ink sm:col-start-auto">
                        {numero(r.calorias)} kcal
                      </span>
                    </motion.li>
                  ))}
                </motion.ul>
              </Estado>
            </div>
          </section>

          <section aria-labelledby="dieta">
            <h2 id="dieta" className="text-xl font-bold text-ink">
              Sua dieta
            </h2>
            <div className="mt-3 overflow-hidden rounded-lg border border-line">
              <Estado
                loading={dietas.loading}
                error={dietas.error}
                onRetry={dietas.reload}
                linhas={3}
                vazio={!dietaAtiva}
                mensagemVazio="Sua nutricionista ainda não montou uma dieta para você."
              >
                {dietaAtiva && (
                  <>
                    <p className="border-b border-line px-4 py-3 text-lg font-bold text-ink">{dietaAtiva.titulo}</p>
                    <ul className="divide-y divide-line">
                      {dietaAtiva.refeicoes.map((r) => (
                        <li key={r.id} className="grid grid-cols-[3.5rem_1fr_auto] items-baseline gap-x-4 px-4 py-3">
                          <span className="font-mono text-base font-bold text-ink">{r.horario}</span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-2 text-base font-semibold text-ink">
                              <Utensils className="size-4 text-muted" aria-hidden />
                              {r.nome}
                            </span>
                            <span className="block text-sm text-muted">{r.descricao}</span>
                          </span>
                          <span className="font-mono text-sm text-muted">
                            {r.meta_calorias ? `${numero(r.meta_calorias)} kcal` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Estado>
            </div>
          </section>
        </div>

        <aside aria-label="Seu cartão" className="order-1 xl:sticky xl:top-8 xl:order-2">
          {painel.data ? (
            <CartaoEmbarque paciente={painel.data} />
          ) : (
            <div className="rounded-[14px] border border-line">
              <Estado loading={painel.loading} error={painel.error} onRetry={painel.reload} linhas={3}>
                {null}
              </Estado>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
