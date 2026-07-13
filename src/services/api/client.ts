export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api"
).replace(/\/$/, "");

export const APP_URL = (import.meta.env.VITE_APP_URL ?? "http://localhost:5173").replace(/\/$/, "");

const TOKEN_KEY = "vidaplus:access_token";
const REFRESH_TOKEN_KEY = "vidaplus:refresh_token";

type ApiErrorBody = {
  status?: string;
  message?: string;
  requestId?: string;
};

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem("vidaplus:user_id");
  window.localStorage.removeItem("vidaplus:role");
  window.localStorage.removeItem("vidaplus:auth");
}

export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  const body = text ? safeJson<ApiErrorBody | T>(text) : null;

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body && body.message
        ? body.message
        : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return body as T;
}

function safeJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}
