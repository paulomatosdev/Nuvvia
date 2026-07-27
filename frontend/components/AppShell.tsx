"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Visão geral" },
  { href: "/agenda", label: "Agenda" },
  { href: "/pacientes", label: "Pacientes" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="w-60 shrink-0 border-r border-line bg-forest text-paper flex flex-col">
        <div className="px-6 py-7">
          <p className="font-display italic text-2xl leading-none">Vitta</p>
          <p className="text-xs text-paper/60 mt-1 tracking-wide uppercase">Painel do nutricionista</p>
        </div>

        <nav className="flex-1 px-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 mb-1 text-sm transition-colors ${
                  active ? "bg-paper/15 text-paper font-medium" : "text-paper/70 hover:bg-paper/10 hover:text-paper"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-5 border-t border-paper/10 text-xs text-paper/50">
          Dra. Karoline Gomes<br />CRN 12345
        </div>
      </aside>

      <main className="flex-1 px-10 py-8">{children}</main>
    </div>
  );
}
