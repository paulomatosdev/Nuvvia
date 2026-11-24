import type { Config } from "tailwindcss";

/** Cor a partir de uma variável CSS com canais RGB (permite /opacidade). */
const v = (nome: string) => `rgb(var(--${nome}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Painel de embarque (a tela)
        bg: v("bg"),
        surface: v("surface"),
        line: v("line"),
        ink: v("ink"),
        muted: v("muted"),
        // Estados do painel
        gate: v("gate"), // âmbar de portão: próxima / foco
        "gate-ink": v("gate-ink"), // âmbar legível como texto
        ok: v("ok"), // dentro da meta / concluída
        alert: v("alert"), // mudança, falta, abaixo da meta
        // Cartão de embarque: sempre o inverso do painel
        pass: v("pass"),
        "pass-ink": v("pass-ink"),
        "pass-muted": v("pass-muted"),
        "pass-line": v("pass-line"),
        "pass-ok": v("pass-ok"),
        "pass-alert": v("pass-alert"),
      },
      fontFamily: {
        sans: ["var(--font-barlow)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // escala de 1.25 a partir de 15px
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["0.9375rem", { lineHeight: "1.4rem" }],
        lg: ["1.1875rem", { lineHeight: "1.6rem" }],
        xl: ["1.4375rem", { lineHeight: "1.8rem" }],
        "2xl": ["1.875rem", { lineHeight: "2.1rem" }],
        "3xl": ["2.375rem", { lineHeight: "2.5rem" }],
        "4xl": ["3rem", { lineHeight: "3rem" }],
      },
      boxShadow: {
        pass: "0 1px 2px rgb(0 0 0 / 0.12), 0 12px 32px -8px rgb(0 0 0 / 0.35)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
