// ---- Tipos que espelham as respostas da API (backend/app/schemas) ----

export type PerfilAcesso = "paciente" | "nutricionista" | "admin";

export type UsuarioMe = {
  id: string;
  nome_completo: string;
  email: string;
  perfil_acesso: PerfilAcesso;
  ativo: boolean;
  criacao_data: string;
  nutricionista_perfil: { crn: string | null; bio: string | null } | null;
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
  nutricionista_id: string;
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

// ---- Tipos de apresentação ----

export type MacroGoal = {
  label: string;
  consumed: number;
  target: number | null;
  unit: "kcal" | "g";
  colorVar: "forest" | "plum" | "mustard" | "teal";
};
