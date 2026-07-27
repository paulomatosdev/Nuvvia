import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F1F3ED",       // fundo — branco-sálvia, não creme
        ink: "#1D2420",         // texto principal
        forest: "#1F3A2E",      // marca / elementos escuros
        forestSoft: "#2F4E3D",
        plum: "#8B3560",        // destaque — proteína / alertas
        mustard: "#C99A2E",     // carboidrato
        teal: "#2C7873",        // gordura
        line: "#DCE0D6",        // divisores
        card: "#FBFBF8",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-plex)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
