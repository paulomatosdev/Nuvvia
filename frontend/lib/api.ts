import type {
  Consulta,
  Exame,
  NovaConsulta,
  PacientePainel,
  RotinaAlimentar,
  StatusConsulta,
  UsuarioMe,
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

  return response.json() as Promise<T>;
}

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
};
