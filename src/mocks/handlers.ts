// Simula chamadas de API: latência, sucesso, erro.
// Quando o backend real estiver pronto, substitua estas funções por chamadas
// HTTP reais em src/services/api/client.ts — os tipos e contratos seguem iguais.

export const FAKE_LATENCY_MS = 450;
export const ERROR_RATE = 0; // 0 = nunca falha; ajuste p/ demonstrar erros

export function delay<T>(value: T, ms = FAKE_LATENCY_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (ERROR_RATE > 0 && Math.random() < ERROR_RATE) {
        reject(new Error("Falha simulada de rede"));
      } else {
        resolve(value);
      }
    }, ms);
  });
}

export function cloneDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
