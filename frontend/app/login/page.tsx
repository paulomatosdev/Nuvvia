"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";

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
      localStorage.setItem("access_token", access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-forest flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-display italic text-4xl text-paper">Vitta</p>
          <p className="text-paper/60 text-sm mt-2">Painel do nutricionista</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-ink/60 mb-1">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm bg-white focus:border-forest outline-none"
              placeholder="seuemail@gmail.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-ink/60 mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm bg-white focus:border-forest outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-plum">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
