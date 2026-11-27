import type {
  JanelaDisponibilidade,
  Notificacao,
  NutricionistaPerfil,
  PacientePerfil,
  Periodo,
  PreferenciaTipo,
  ResultadoAgendamento,
  AlimentoCatalogo,
  AlimentoOpcao,
  QuestionarioSalvo,
  RespostasQuestionario,
  ResultadoQuestionario,
  Consulta,
  Exame,
  NovaConsulta,
  NovaRefeicao,
  PacientePainel,
  PerfilAcesso,
  RegistroAlimentar,
  RotinaAlimentar,
  StatusConsulta,
  UsuarioMe,
  UsuarioResumo,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const TOKEN_KEY = "access_token";

/** Erro com o status HTTP, para a interface reagir a 401/403/404. */
export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export const tokenStore = {
  get: () => (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

function mensagemDeErro(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown })?.detail;
  if (typeof detail === "string") return detail;
  // Erros de validação do FastAPI (422) vêm como lista
  if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
  return `Erro na requisição: ${status}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("Não foi possível conectar ao servidor. Verifique se a API está rodando.", 0);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(mensagemDeErro(body, response.status), response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const requestSemCorpo = (path: string, options: RequestInit = {}) => request<void>(path, options);

export const api = {
  login: (email: string, senha: string) =>
    request<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    }),

  me: () => request<UsuarioMe>("/usuarios/me"),

  pacientes: () => request<PacientePainel[]>("/pacientes"),

  paciente: (id: string) => request<PacientePainel>(`/pacientes/${id}`),

  minhasConsultas: () => request<Consulta[]>("/consultas/minhas"),

  criarConsulta: (dados: NovaConsulta) =>
    request<Consulta>("/consultas", { method: "POST", body: JSON.stringify(dados) }),

  atualizarStatusConsulta: (id: string, status: StatusConsulta) =>
    request<Consulta>(`/consultas/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  examesDoPaciente: (pacienteId: string) => request<Exame[]>(`/exames/paciente/${pacienteId}`),

  dietasDoPaciente: (pacienteId: string) =>
    request<RotinaAlimentar[]>(`/dietas/paciente/${pacienteId}`),

  // ---- Conta ----
  registrar: (dados: { nome_completo: string; email: string; senha: string; perfil_acesso: PerfilAcesso }) =>
    request<UsuarioMe>("/auth/registrar", { method: "POST", body: JSON.stringify(dados) }),

  atualizarPerfilNutricionista: (dados: Partial<NutricionistaPerfil>) =>
    request("/usuarios/me/nutricionista-perfil", { method: "PUT", body: JSON.stringify(dados) }),

  // ---- Área do paciente ----
  meuPainel: () => request<PacientePainel>("/pacientes/me"),

  nutricionistas: () => request<UsuarioResumo[]>("/usuarios/nutricionistas"),

  agendarComNutricionista: (dados: Omit<NovaConsulta, "paciente_id"> & { nutricionista_id: string }) =>
    request<Consulta>("/consultas", { method: "POST", body: JSON.stringify(dados) }),

  refeicoesDeHoje: () => request<RegistroAlimentar[]>("/registros-alimentares/hoje"),

  // ---- Questionário alimentar ----
  alimentosDoQuestionario: () => request<AlimentoOpcao[]>("/questionario/alimentos"),

  meuUltimoQuestionario: () => request<QuestionarioSalvo | null>("/questionario/ultimo"),

  responderQuestionario: (respostas: RespostasQuestionario) =>
    request<ResultadoQuestionario>("/questionario", { method: "POST", body: JSON.stringify(respostas) }),

  questionarioDoPaciente: (pacienteId: string) =>
    request<QuestionarioSalvo | null>(`/pacientes/${pacienteId}/questionario`),

  // ---- Agendamento pelo agente ----
  solicitarConsulta: (prefs: {
    tipo?: PreferenciaTipo | null;
    periodos?: Periodo[] | null;
    cidade?: string | null;
    bairro?: string | null;
  }) => request<ResultadoAgendamento>("/agendamento/solicitar", { method: "POST", body: JSON.stringify(prefs) }),

  responderPresenca: (consultaId: string, acao: "confirmar" | "remarcar") =>
    request<ResultadoAgendamento>(`/agendamento/consultas/${consultaId}/presenca`, {
      method: "POST",
      body: JSON.stringify({ acao }),
    }),

  meuPerfilPaciente: () => request<PacientePerfil>("/usuarios/me/paciente-perfil"),

  minhaNutricionista: () => request<{ id: string; nome_completo: string } | null>("/usuarios/me/nutricionista"),

  // ---- Notificações ----
  notificacoes: () => request<{ nao_lidas: number; itens: Notificacao[] }>("/notificacoes"),

  marcarNotificacaoLida: (id: string) => requestSemCorpo(`/notificacoes/${id}/lida`, { method: "POST" }),

  marcarTodasLidas: () => requestSemCorpo("/notificacoes/marcar-todas", { method: "POST" }),

  // ---- Atendimento da nutricionista ----
  minhaDisponibilidade: () => request<JanelaDisponibilidade[]>("/usuarios/me/disponibilidade"),

  definirDisponibilidade: (janelas: JanelaDisponibilidade[]) =>
    request<JanelaDisponibilidade[]>("/usuarios/me/disponibilidade", { method: "PUT", body: JSON.stringify(janelas) }),

  catalogoDeAlimentos: () => request<AlimentoCatalogo[]>("/alimentos"),

  registrarRefeicaoPorItens: (dados: { nome?: string | null; itens: { alimento_id: string; gramas: number }[] }) =>
    request<RegistroAlimentar>("/registros-alimentares/itens", { method: "POST", body: JSON.stringify(dados) }),

  registrarRefeicao: (dados: NovaRefeicao) =>
    request<RegistroAlimentar>("/registros-alimentares/manual", { method: "POST", body: JSON.stringify(dados) }),
};

/** Página inicial de cada perfil depois do login. */
export function inicioDoPerfil(perfil: PerfilAcesso) {
  return perfil === "paciente" ? "/minha-area" : "/dashboard";
}
