// ---- Tipos que espelham as respostas da API (backend/app/schemas) ----

export type PerfilAcesso = "paciente" | "nutricionista" | "admin";

export type UsuarioMe = {
  id: string;
  nome_completo: string;
  email: string;
  perfil_acesso: PerfilAcesso;
  ativo: boolean;
  criacao_data: string;
  nutricionista_perfil: NutricionistaPerfil | null;
};

export type ResumoMacrosDiario = {
  data: string;
  calorias_consumidas: number;
  proteina_consumida_g: number;
  carboidratos_consumidos_g: number;
  gordura_consumida_g: number;
  meta_calorias: number | null;
  meta_proteina_g: number | null;
  meta_carboidratos_g: number | null;
  meta_gordura_g: number | null;
};

export type DiaAdesao = { data: string; calorias: number; na_meta: boolean | null };

export type PacientePainel = {
  id: string;
  nome_completo: string;
  email: string;
  meta: string | null;
  data_nascimento: string | null;
  altura_cm: number | null;
  peso_kg: number | null;
  ultima_consulta: string | null;
  proxima_consulta: string | null;
  macros_hoje: ResumoMacrosDiario;
  adesao_7d: number | null;
  semana: DiaAdesao[];
};

export type TipoConsulta = "pessoal" | "online";
export type StatusConsulta =
  | "agendado"
  | "confirmado"
  | "cancelado"
  | "completado"
  | "nao_comparecimento";

export type Consulta = {
  id: string;
  paciente_id: string;
  nutricionista_id: string;
  paciente: { id: string; nome_completo: string };
  nutricionista: { id: string; nome_completo: string };
  tipo_consulta: TipoConsulta;
  status: StatusConsulta;
  agendamento_data: string;
  duracao_minutos: number;
  video_chamada_url: string | null;
  local: string | null;
  notas: string | null;
  /** Por que o agente de agendamento escolheu este horário */
  motivo_agente?: string | null;
  criacao_data: string;
};

export type NovaConsulta = {
  paciente_id: string;
  tipo_consulta: TipoConsulta;
  agendamento_data: string;
  duracao_minutos?: number;
  local?: string | null;
  notas?: string | null;
};

export type DietaMeta = "perder_peso" | "ganho_muscular" | "manutencao" | "condicao_saude";

export type RotinaAlimentar = {
  id: string;
  paciente_id: string;
  nutricionista_id: string | null;
  /** "nutricionista" (montada por ela) ou "app" (gerada pelo questionário) */
  origem: "nutricionista" | "app";
  explicacao: string | null;
  titulo: string;
  objetivo: DietaMeta;
  ativo: boolean;
  data_inicio: string;
  data_termino: string | null;
  criacao_data: string;
  refeicoes: {
    id: string;
    nome: string;
    horario: string;
    /** 0 = segunda ... 6 = domingo; null = vale todos os dias */
    dia_semana: number | null;
    descricao: string;
    meta_calorias: number | null;
    meta_proteina_g: number | null;
    meta_carboidratos_g: number | null;
    meta_gordura_g: number | null;
  }[];
};

export type Exame = {
  id: string;
  paciente_id: string;
  enviado_por_id: string;
  titulo: string;
  data_exame: string;
  arquivo_url: string;
  notas: string | null;
  criacao_data: string;
};

export type UsuarioResumo = { id: string; nome_completo: string; email: string };

// ---- Agendamento pelo agente e notificações ----

export type Periodo = "manha" | "tarde" | "noite";
export type PreferenciaTipo = "online" | "pessoal" | "tanto_faz";

export type PacientePerfil = {
  id: string;
  usuario_id: string;
  cidade: string | null;
  bairro: string | null;
  preferencia_tipo: PreferenciaTipo | null;
  preferencia_periodos: Periodo[] | null;
  nutricionista_id: string | null;
};

export type ResultadoAgendamento = {
  consulta: Consulta;
  explicacao: string;
  alternativas: {
    nutricionista: { id: string; nome_completo: string };
    inicio: string;
    tipo: TipoConsulta;
    local: string | null;
  }[];
};

export type Notificacao = {
  id: string;
  tipo: "consulta_marcada" | "consulta_confirmada" | "consulta_remarcada" | "lembrete_consulta" | "vinculo" | string;
  titulo: string;
  mensagem: string;
  consulta_id: string | null;
  lida: boolean;
  criacao_data: string;
};

export type JanelaDisponibilidade = { dia_semana: number; hora_inicio: string; hora_fim: string };

export type NutricionistaPerfil = {
  crn: string | null;
  bio: string | null;
  cidade: string | null;
  bairro: string | null;
  endereco: string | null;
  atende_online: boolean;
  atende_presencial: boolean;
  duracao_consulta_min: number;
};

export type AlimentoCatalogo = {
  id: string;
  nome: string;
  grupo: string;
  kcal: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
  medidas: { nome: string; gramas: number }[];
  fonte: string;
};

// ---- Questionário alimentar ----

export type NivelAtividade = "sedentario" | "leve" | "moderado" | "alto" | "muito_alto";
export type Restricao = "vegetariano" | "vegano" | "sem_lactose" | "sem_gluten";
export type CondicaoSaude = "diabetes" | "hipertensao" | "doenca_renal" | "gestante_lactante" | "outra";

export type RespostasQuestionario = {
  sexo: "feminino" | "masculino";
  data_nascimento: string;
  altura_cm: number;
  peso_kg: number;
  nivel_atividade: NivelAtividade;
  objetivo: DietaMeta;
  refeicoes_por_dia: number;
  tempo_cozinhar: "pouco" | "medio" | "bastante";
  restricoes: Restricao[];
  alergias: string | null;
  condicoes_saude: CondicaoSaude[];
  alimentos_preferidos: string[];
  alimentos_evitados: string[];
  modo: "app" | "nutricionista";
};

export type AlimentoOpcao = { id: string; nome: string; grupo: string; etiquetas: string[] };

export type QuestionarioSalvo = {
  id: string;
  paciente_id: string;
  respostas: RespostasQuestionario;
  modo: "app" | "nutricionista";
  criacao_data: string;
};

export type ResultadoQuestionario = {
  modo: "app" | "nutricionista";
  recomendacao_consulta: boolean;
  motivo: string | null;
  metas: { calorias: number; proteina_g: number; carboidratos_g: number; gordura_g: number } | null;
  calculos: Record<string, number> | null;
  dieta: RotinaAlimentar | null;
  referencias: { titulo: string; url: string }[];
};

export type RegistroAlimentar = {
  id: string;
  paciente_id: string;
  fonte: "foto_ia" | "manual";
  foto_url: string | null;
  descricao: string;
  calorias: number;
  proteina_g: number;
  carboidratos_g: number;
  gordura_g: number;
  ai_confidence: number | null;
  registro_data: string;
};

export type NovaRefeicao = {
  descricao: string;
  calorias: number;
  proteina_g: number;
  carboidratos_g: number;
  gordura_g: number;
};

// ---- Tipos de apresentação ----

export type MacroGoal = {
  label: string;
  consumed: number;
  target: number | null;
  unit: "kcal" | "g";
  colorVar: "forest" | "plum" | "mustard" | "teal";
};
