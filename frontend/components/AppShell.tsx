"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect } from "react";
import { MotionConfig, motion } from "motion/react";
import { CalendarDays, LayoutList, LogOut, Moon, Sun, Ticket, Users } from "lucide-react";
import { api, inicioDoPerfil, tokenStore } from "@/lib/api";
import { useTema } from "@/lib/tema";
import { PerfilAcesso, UsuarioMe } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { MOLA_LAYOUT } from "./motion";

const NAV_NUTRI = [
  { href: "/dashboard", label: "Hoje", Icone: LayoutList },
  { href: "/agenda", label: "Agenda", Icone: CalendarDays },
  { href: "/pacientes", label: "Pacientes", Icone: Users },
];

const NAV_PACIENTE = [
  { href: "/minha-area", label: "Minha área", Icone: Ticket },
  { href: "/minhas-consultas", label: "Consultas", Icone: CalendarDays },
];

type Area = "nutricionista" | "paciente";

/** Perfis que podem abrir cada área do app. */
const PERMITIDOS: Record<Area, PerfilAcesso[]> = {
  nutricionista: ["nutricionista", "admin"],
  paciente: ["paciente"],
};

const UsuarioContext = createContext<UsuarioMe | null>(null);

/** Usuário logado. Só pode ser usado dentro do AppShell. */
export function useUsuario(): UsuarioMe {
  const usuario = useContext(UsuarioContext);
  if (!usuario) throw new Error("useUsuario precisa estar dentro do AppShell");
  return usuario;
}

export function Marca({ className = "" }: { className?: string }) {
  return (
    <span className={`font-extrabold tracking-[-0.03em] ${className}`}>
      Nuvvia<span className="text-gate">.</span>
    </span>
  );
}

export function BotaoTema({ className = "" }: { className?: string }) {
  const { tema, alternar } = useTema();
  const escuro = tema === "escuro";
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={escuro ? "Usar tema claro" : "Usar tema escuro"}
      title={escuro ? "Tema claro" : "Tema escuro"}
      className={`grid size-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink ${className}`}
    >
      <motion.span
        key={tema}
        initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="grid place-items-center"
      >
        {escuro ? <Sun className="size-[18px]" aria-hidden /> : <Moon className="size-[18px]" aria-hidden />}
      </motion.span>
    </button>
  );
}

export function AppShell({ children, area = "nutricionista" }: { children: React.ReactNode; area?: Area }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: usuario, error } = useApi(api.me);
  const permitido = usuario ? PERMITIDOS[area].includes(usuario.perfil_acesso) : false;

  useEffect(() => {
    if (!tokenStore.get()) router.replace("/login");
  }, [router]);

  // Cada perfil só vê a própria área; quem entra na área errada é levado à sua
  useEffect(() => {
    if (usuario && !permitido) router.replace(inicioDoPerfil(usuario.perfil_acesso));
  }, [usuario, permitido, router]);

  function sair() {
    tokenStore.clear();
    router.replace("/login");
  }

  const crn = usuario?.nutricionista_perfil?.crn;
  const NAV_ITEMS = usuario?.perfil_acesso === "paciente" ? NAV_PACIENTE : NAV_NUTRI;
  const subtitulo = usuario?.perfil_acesso === "paciente" ? usuario.email : (crn ?? "CRN não informado");

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col bg-bg md:flex-row">
        <aside className="sticky top-0 z-20 flex shrink-0 items-center gap-2 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur md:h-screen md:w-56 md:flex-col md:items-stretch md:gap-0 md:border-b-0 md:border-r md:px-3 md:py-6 md:backdrop-blur-none">
          <Link href={usuario ? inicioDoPerfil(usuario.perfil_acesso) : "/login"} className="px-2 text-2xl md:mb-8">
            <Marca />
          </Link>

          <nav aria-label="Principal" className="flex flex-1 gap-1 md:flex-none md:flex-col">
            {NAV_ITEMS.map(({ href, label, Icone }) => {
              const ativo = pathname?.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={ativo ? "page" : undefined}
                  className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-base font-semibold transition-colors ${
                    ativo ? "text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {ativo && (
                    <motion.span
                      layoutId="nav-ativo"
                      transition={MOLA_LAYOUT}
                      className="absolute inset-0 rounded-md bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.08)]"
                      aria-hidden
                    />
                  )}
                  <Icone className="relative size-[18px]" strokeWidth={2} aria-hidden />
                  <span className="relative hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 md:mt-auto md:flex-col md:items-stretch md:gap-3 md:border-t md:border-line md:pt-4">
            {usuario && (
              <div className="hidden px-2 md:block">
                <p className="truncate text-base font-semibold text-ink">{usuario.nome_completo}</p>
                <p className="truncate font-mono text-xs text-muted">{subtitulo}</p>
              </div>
            )}
            <div className="flex items-center gap-1 md:px-1">
              <BotaoTema />
              <button
                type="button"
                onClick={sair}
                className="flex h-9 items-center gap-2 rounded-md px-2.5 text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-ink"
              >
                <LogOut className="size-4" aria-hidden />
                <span className="hidden md:inline">Sair</span>
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-6 md:px-10 md:py-8">
          {error ? (
            <p role="alert" className="text-base text-alert">
              {error}
            </p>
          ) : !usuario || !permitido ? (
            <div className="h-8 w-64 animate-pulse rounded bg-line" aria-label="Carregando" />
          ) : (
            <UsuarioContext.Provider value={usuario}>{children}</UsuarioContext.Provider>
          )}
        </main>
      </div>
    </MotionConfig>
  );
}
