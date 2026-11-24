import type { MacroGoal, ResumoMacrosDiario, StatusConsulta, TipoConsulta } from "./types";

const LOCALE = "pt-BR";

function mesmoDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isHoje(iso: string) {
  return mesmoDia(new Date(iso), new Date());
}

/** "Hoje", "Amanhã", "Ontem" ou "qua., 3 de dez." */
export function rotuloDia(iso: string) {
  const data = new Date(iso);
  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(hoje.getDate() + 1);
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);

  if (mesmoDia(data, hoje)) return "Hoje";
  if (mesmoDia(data, amanha)) return "Amanhã";
  if (mesmoDia(data, ontem)) return "Ontem";
  return data.toLocaleDateString(LOCALE, { weekday: "short", day: "numeric", month: "short" });
}

export function hora(iso: string) {
  return new Date(iso).toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
}

export function dataCurta(iso: string | null) {
  if (!iso) return "—";
  // Datas puras (AAAA-MM-DD) são exibidas sem conversão de fuso
  const data = iso.length === 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return data.toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric" });
}

export function dataPorExtenso(d = new Date()) {
  const texto = d.toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function saudacao(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function primeiroNome(nome: string) {
  return nome.split(" ")[0];
}

export const STATUS_LABEL: Record<StatusConsulta, string> = {
  agendado: "Agendada",
  confirmado: "Confirmada",
  completado: "Concluída",
  cancelado: "Cancelada",
  nao_comparecimento: "Faltou",
};

export const TIPO_LABEL: Record<TipoConsulta, string> = {
  pessoal: "Presencial",
  online: "Online",
};

export function macrosDe(resumo: ResumoMacrosDiario): MacroGoal[] {
  return [
    { label: "Calorias", consumed: resumo.calorias_consumidas, target: resumo.meta_calorias, unit: "kcal", colorVar: "forest" },
    { label: "Proteína", consumed: resumo.proteina_consumida_g, target: resumo.meta_proteina_g, unit: "g", colorVar: "plum" },
    { label: "Carboidrato", consumed: resumo.carboidratos_consumidos_g, target: resumo.meta_carboidratos_g, unit: "g", colorVar: "mustard" },
    { label: "Gordura", consumed: resumo.gordura_consumida_g, target: resumo.meta_gordura_g, unit: "g", colorVar: "teal" },
  ];
}

export function numero(n: number) {
  return Math.round(n).toLocaleString(LOCALE);
}
