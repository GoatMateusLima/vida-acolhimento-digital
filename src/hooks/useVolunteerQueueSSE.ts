import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL, getAccessToken } from "@/services/api/client";
import type { QueueEntry } from "@/types";

function mapQueueEntry(input: any): QueueEntry {
  const waitingSince = input.created_at ?? new Date().toISOString();
  const waitedMinutes = Math.max(
    1,
    Math.round((Date.now() - new Date(waitingSince).getTime()) / 60000),
  );
  return {
    id: input.id,
    alias: input.anonymous_name ?? "Pessoa aguardando",
    topic: "Acolhimento emocional",
    priority: input.priority ?? "normal",
    waitingSince,
    estimatedWait: Math.max(1, 5 - waitedMinutes),
  };
}

/**
 * Mantém o voluntário conectado ao canal SSE de fila global.
 * Atualiza automaticamente o cache TanStack Query ["queue"] em tempo real.
 *
 * Comportamentos:
 *  - queue_snapshot  → substitui a lista completa (enviado ao conectar)
 *  - queue_entry     → adiciona nova entrada sem duplicar
 *  - queue_remove    → remove a entrada aceita por outro voluntário
 *  - heartbeat       → ignorado (manutenção de conexão)
 *  - done=true       → reconecta com backoff exponencial
 *  - !res.ok         → reconecta com backoff (Render acordando)
 *  - Desmontagem     → abort + limpa todos os timers
 */
export function useVolunteerQueueSSE(enabled = true) {
  const qc = useQueryClient();
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);

  // Expõe função para forçar refetch manual (ex: após aceitar)
  const refetchQueue = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["queue"] });
  }, [qc]);

  useEffect(() => {
    if (!enabled) return;

    let controller = new AbortController();
    let isMounted = true;

    function handleReconnect() {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      const delay = Math.min(1000 * Math.pow(2, attemptRef.current), 30_000);
      attemptRef.current += 1;
      reconnectTimerRef.current = setTimeout(() => {
        if (!isMounted) return;
        controller.abort();
        controller = new AbortController();
        connect();
      }, delay);
    }

    function connect() {
      const token = getAccessToken();
      if (!token || !isMounted) return;

      const url = `${API_BASE_URL}/conversations/volunteer/queue-events`;

      fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) { handleReconnect(); return; }
          if (!res.body) { handleReconnect(); return; }

          // Conexão bem-sucedida: reseta o backoff
          attemptRef.current = 0;

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          function pump() {
            reader
              .read()
              .then(({ done, value }) => {
                if (done) {
                  if (isMounted) handleReconnect();
                  return;
                }

                buffer += decoder.decode(value, { stream: true });
                const blocks = buffer.split("\n\n");
                buffer = blocks.pop() ?? "";

                for (const block of blocks) {
                  let eventType = "message";
                  let dataLine = "";

                  for (const line of block.split("\n")) {
                    if (line.startsWith("event:")) {
                      eventType = line.replace("event:", "").trim();
                    } else if (line.startsWith("data:")) {
                      dataLine = line.replace("data:", "").trim();
                    }
                  }

                  if (eventType === "heartbeat" || !dataLine) continue;

                  if (eventType === "queue_snapshot") {
                    // Snapshot inicial: substitui a lista completa no cache
                    try {
                      const raw: any[] = JSON.parse(dataLine);
                      qc.setQueryData<QueueEntry[]>(["queue"], raw.map(mapQueueEntry));
                    } catch {}
                    continue;
                  }

                  if (eventType === "queue_entry") {
                    // Nova pessoa na fila: adiciona sem duplicar
                    try {
                      const raw = JSON.parse(dataLine);
                      const entry = mapQueueEntry(raw);
                      qc.setQueryData<QueueEntry[]>(["queue"], (curr) => {
                        const existing = curr ?? [];
                        if (existing.some((e) => e.id === entry.id)) return existing;
                        return [...existing, entry];
                      });
                    } catch {}
                    continue;
                  }

                  if (eventType === "queue_remove") {
                    // Conversa aceita por outro voluntário: remove da lista
                    try {
                      const raw = JSON.parse(dataLine);
                      if (raw.id) {
                        qc.setQueryData<QueueEntry[]>(["queue"], (curr) =>
                          (curr ?? []).filter((e) => e.id !== raw.id)
                        );
                      }
                    } catch {}
                    continue;
                  }
                }

                pump();
              })
              .catch(() => {
                if (isMounted) handleReconnect();
              });
          }

          pump();
        })
        .catch((err) => {
          if ((err as Error)?.name !== "AbortError" && isMounted) {
            handleReconnect();
          }
        });
    }

    connect();

    return () => {
      isMounted = false;
      controller.abort();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [enabled, qc]);

  return { refetchQueue };
}
