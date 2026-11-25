"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BotaoEmbarcar, CampoCartao, CartaoAcesso } from "@/components/CartaoAcesso";
import { api, inicioDoPerfil, tokenStore } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const { access_token } = await api.login(email, senha);
      tokenStore.set(access_token);
      const usuario = await api.me();
      // Nutricionista vai para o painel do dia; paciente, para a própria área
      router.push(inicioDoPerfil(usuario.perfil_acesso));
    } catch (err) {
      tokenStore.clear();
      setErro(err instanceof Error ? err.message : "Não foi possível entrar");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <CartaoAcesso
      subtitulo="Entre como nutricionista ou paciente"
      erro={erro}
      onSubmit={entrar}
      rodape={
        <>
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-semibold text-ink underline">
            Criar conta
          </Link>
        </>
      }
    >
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
      <CampoCartao
        id="senha"
        rotulo="Senha"
        type="password"
        required
        autoComplete="current-password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
      />
      <BotaoEmbarcar carregando={carregando}>{carregando ? "Entrando…" : "Entrar"}</BotaoEmbarcar>
    </CartaoAcesso>
  );
}
