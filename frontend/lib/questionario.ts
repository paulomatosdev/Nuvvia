import type { CondicaoSaude, DietaMeta, NivelAtividade, Restricao, RespostasQuestionario } from "./types";

export const ATIVIDADES: { valor: NivelAtividade; label: string; descricao: string }[] = [
  { valor: "sedentario", label: "Pouco ativa", descricao: "Trabalho sentado e quase nenhum exercício." },
  { valor: "leve", label: "Levemente ativa", descricao: "Exercício leve 1 a 3 vezes por semana." },
  { valor: "moderado", label: "Moderadamente ativa", descricao: "Exercício moderado 3 a 5 vezes por semana." },
  { valor: "alto", label: "Muito ativa", descricao: "Treino intenso 6 a 7 vezes por semana." },
  { valor: "muito_alto", label: "Extremamente ativa", descricao: "Treino pesado diário ou trabalho físico." },
];

export const OBJETIVOS: { valor: DietaMeta; label: string; descricao: string }[] = [
  { valor: "perder_peso", label: "Perder peso", descricao: "Reduzir gordura num ritmo sustentável." },
  { valor: "ganho_muscular", label: "Ganhar massa muscular", descricao: "Comer o suficiente para crescer com o treino." },
  { valor: "manutencao", label: "Manter o peso", descricao: "Comer melhor sem mudar o peso." },
  { valor: "condicao_saude", label: "Cuidar de uma condição de saúde", descricao: "Ex.: diabetes, colesterol, pressão." },
];

export const RESTRICOES: { valor: Restricao; label: string }[] = [
  { valor: "vegetariano", label: "Vegetariana" },
  { valor: "vegano", label: "Vegana" },
  { valor: "sem_lactose", label: "Sem lactose" },
  { valor: "sem_gluten", label: "Sem glúten" },
];

export const CONDICOES: { valor: CondicaoSaude; label: string }[] = [
  { valor: "diabetes", label: "Diabetes" },
  { valor: "hipertensao", label: "Pressão alta" },
  { valor: "doenca_renal", label: "Doença renal" },
  { valor: "gestante_lactante", label: "Gestante ou amamentando" },
  { valor: "outra", label: "Outra condição" },
];

export const TEMPOS: { valor: RespostasQuestionario["tempo_cozinhar"]; label: string }[] = [
  { valor: "pouco", label: "Pouco" },
  { valor: "medio", label: "Médio" },
  { valor: "bastante", label: "Bastante" },
];

export const GRUPOS: { valor: string; label: string }[] = [
  { valor: "proteina", label: "Proteínas" },
  { valor: "leguminosa", label: "Leguminosas" },
  { valor: "carboidrato", label: "Carboidratos" },
  { valor: "fruta", label: "Frutas" },
  { valor: "vegetal", label: "Verduras e legumes" },
  { valor: "gordura", label: "Gorduras boas" },
];

/** O que cada restrição tira da lista de alimentos (espelha o backend). */
export const EXCLUI: Record<Restricao, string[]> = {
  vegetariano: ["carne"],
  vegano: ["carne", "animal"],
  sem_lactose: ["lactose"],
  sem_gluten: ["gluten"],
};

export const rotuloDe = <T extends string>(lista: { valor: T; label: string }[], valor: T) =>
  lista.find((i) => i.valor === valor)?.label ?? valor;
