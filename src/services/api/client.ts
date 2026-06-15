// Ponto único para futuramente integrar com a API real.
// Hoje os services consomem mocks via src/mocks/handlers.ts.
// Para conectar à API real, implemente aqui um fetch wrapper e reaproveite
// os tipos exportados em src/types/.
export const API_BASE_URL = "/api";

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  // Placeholder — não é chamado enquanto usamos mocks.
  const res = await fetch(`${API_BASE_URL}${path}`, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}
