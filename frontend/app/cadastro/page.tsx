"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { BotaoEmbarcar, CampoCartao, CartaoAcesso } from "@/components/CartaoAcesso";
import { EASE_OUT, MOLA_LAYOUT } from "@/components/motion";
import { api, inicioDoPerfil, tokenStore } from "@/lib/api";
import { PerfilAcesso } from "@/lib/types";

const PERFIS: { valor: Extract<PerfilAcesso, "nutricionista" | "paciente">; label: string }[] = [
  { valor: "nutricionista", label: "Nutricionista" },
  { valor: "paciente", label: "Paciente" },
];

export default function CadastroPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<"nutricionista" | "paciente">("nutricionista");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [crn, setCrn] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha.length < 8) {
      setErro("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      setErro("As senhas não conferem.");
      return;
    }
    setCarregando(true);
    try {
      await api.registrar({ nome_completo: nome.trim(), email, senha, perfil_acesso: perfil });
      const { access_token } = await api.login(email, senha);
      tokenStore.set(access_token);
      if (perfil === "nutricionista" && crn.trim()) {
        await api.atualizarPerfilNutricionista({ crn: crn.trim() });
      }
      // Paciente novo começa pelo questionário que monta a dieta
      router.push(perfil === "paciente" ? "/questionario" : inicioDoPerfil(perfil));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível criar a conta");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <CartaoAcesso
      subtitulo="Crie sua conta"
      erro={erro}
      onSubmit={cadastrar}
      rodape={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-ink underline">
            Entrar
          </Link>
        </>
      }
    >
      <fieldset>
        <legend className="rotulo mb-1.5 block text-pass-muted">Eu sou</legend>
        <div className="grid grid-cols-2 gap-1 rounded-md border border-pass-line p-1">
          {PERFIS.map(({ valor, label }) => (
            <label
              key={valor}
              className={`relative cursor-pointer rounded px-3 py-2 text-center text-base font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gate ${
                perfil === valor ? "text-pass" : "text-pass-muted hover:text-pass-ink"
              }`}
            >
              {perfil === valor && (
                <motion.span
                  layoutId="perfil-cadastro"
                  transition={MOLA_LAYOUT}
                  className="absolute inset-0 rounded bg-pass-ink"
                  aria-hidden
                />
              )}
              <input
                type="radio"
                name="perfil"
                value={valor}
                checked={perfil === valor}
                onChange={() => setPerfil(valor)}
                className="sr-only"
              />
              <span className="relative">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <CampoCartao
        id="nome"
        rotulo="Nome completo"
        required
        minLength={2}
        autoComplete="name"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      <CampoCartao
        id="email"
        rotulo="E-mail"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seuemail@exemplo.com"
      />

      <AnimatePresence initial={false}>
        {perfil === "nutricionista" && (
          <motion.div
            key="crn"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className="-m-1 overflow-hidden p-1"
          >
            <CampoCartao
              id="crn"
              rotulo="CRN (opcional)"
              value={crn}
              onChange={(e) => setCrn(e.target.value)}
              placeholder="CRN-3 12345"
              dica="Aparece no seu painel. Dá para preencher depois."
            />
          </motion.div>
        )}
      </AnimatePresence>

      <CampoCartao
        id="senha"
        rotulo="Senha"
        type="password"
        required
        minLength={8}
        maxLength={72}
        autoComplete="new-password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        dica="Pelo menos 8 caracteres."
      />
      <CampoCartao
        id="confirmacao"
        rotulo="Confirme a senha"
        type="password"
        required
        autoComplete="new-password"
        value={confirmacao}
        onChange={(e) => setConfirmacao(e.target.value)}
      />

      <BotaoEmbarcar carregando={carregando}>{carregando ? "Criando conta…" : "Criar conta"}</BotaoEmbarcar>
    </CartaoAcesso>
  );
}
