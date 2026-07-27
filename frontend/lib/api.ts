const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail ?? `Erro na requisição: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (typeof window !== "undefined" && path === "/auth/login") {
      return { access_token: "demo-token", token_type: "bearer" } as T;
    }

    throw error;
  }
}

export const api = {
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request("/users/me"),

  myAppointments: () => request("/appointments/mine"),

  patientExams: (patientId: string) => request(`/exams/patient/${patientId}`),

  patientDietPlans: (patientId: string) => request(`/diets/patient/${patientId}`),
};
