"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, tokenStore } from "@/lib/api";
import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { BotaoTema, Marca } from "@/components/AppShell";
import { EASE_OUT } from "@/components/motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { access_token } = await api.login(email, password);
      tokenStore.set(access_token);
      const usuario = await api.me();
      if (usuario.perfil_acesso === "paciente") {
        tokenStore.clear();
        setError("Este painel é para nutricionistas. Pacientes usam o aplicativo.");
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar");
    } finally {
      setLoading(false);
    }
  }

  const reduzir = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-screen items-center justify-center bg-bg px-4 py-10">
        <BotaoTema className="absolute right-4 top-4" />
        <motion.form
          onSubmit={handleSubmit}
          initial={reduzir ? false : { clipPath: "inset(0 0 100% 0 round 14px)" }}
          animate={{ clipPath: "inset(0 0 0% 0 round 14px)", x: error ? [0, -6, 6, -3, 3, 0] : 0 }}
          transition={{ clipPath: { duration: 0.8, ease: EASE_OUT }, x: { duration: 0.4 } }}
          className="w-full max-w-sm rounded-[14px] bg-pass text-pass-ink shadow-pass"
        >
          <div className="picote px-7 pb-7 pt-8">
            <h1 className="text-5xl"><Marca /></h1>
            <p className="mt-2 text-lg text-pass-muted">Painel da nutricionista</p>
          </div>

          <div className="flex flex-col gap-5 px-7 pb-7 pt-8">
            <div>
              <label htmlFor="email" className="rotulo mb-1.5 block text-pass-muted">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-pass-line bg-transparent px-3 py-2.5 text-base text-pass-ink outline-none transition-colors placeholder:text-pass-muted focus:border-gate"
                placeholder="seuemail@exemplo.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="rotulo mb-1.5 block text-pass-muted">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-pass-line bg-transparent px-3 py-2.5 text-base text-pass-ink outline-none transition-colors placeholder:text-pass-muted focus:border-gate"
              />
            </div>

            {error && (
              <p role="alert" className="text-base text-pass-alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gate text-base font-bold text-[rgb(11_15_20)] transition-[filter,transform] duration-150 hover:brightness-95 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </div>
        </motion.form>
      </div>
    </MotionConfig>
  );
}
