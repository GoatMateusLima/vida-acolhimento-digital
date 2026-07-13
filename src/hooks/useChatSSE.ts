import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL, getAccessToken } from "@/services/api/client";
import type { ChatMessage } from "@/types";

/**
 * Conecta ao SSE de mensagens de uma conversa e atualiza o cache do TanStack Query
 * automaticamente quando novas mensagens chegam.
 *
 * O backend expõe:
 *   GET /conversations/:id/events?after=<ISO>
 *
 * Eventos esperados:
 *   event: message  → nova mensagem (objeto ChatMessage serializado)
 *   event: heartbeat → keepalive, ignorado
 *   event: error    → canal encerrado
 */
export function useChatSSE(conversationId: string, enabled = true) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled || !conversationId) return;

    function connect() {
      const token = getAccessToken();
      if (!token) return;

      // EventSource nativo não suporta headers — usamos fetch + ReadableStream
      // para enviar o Authorization. Se o backend aceitar o token via query param,
      // podemos usar EventSource direto como fallback.
      const url = `${API_BASE_URL}/conversations/${conversationId}/events`;

      const controller = new AbortController();

      fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok || !res.body) return;

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          function pump() {
            reader
              .read()
              .then(({ done, value }) => {
                if (done) return;
                buffer += decoder.decode(value, { stream: true });

                // Processa cada bloco SSE separado por linha dupla
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
                  if (eventType === "error") return; // canal encerrado normalmente

                  if (eventType === "message") {
                    try {
                      const raw = JSON.parse(dataLine);
                      // Monta ChatMessage compatível com o cache existente
                      const msg: ChatMessage = {
                        id: raw.id,
                        conversationId: raw.conversation_id ?? conversationId,
                        author:
                          raw.type === "system" || raw.sender_id == null
                            ? "system"
                            : raw.sender_id === window.localStorage.getItem("vidaplus:user_id")
                              ? "user"
                              : "volunteer",
                        text: raw.body_encrypted ?? raw.body ?? raw.text ?? "",
                        createdAt: raw.created_at ?? new Date().toISOString(),
                        status: "sent",
                      };

                      // Adiciona ao cache sem duplicar
                      qc.setQueryData<ChatMessage[]>(["messages", conversationId], (curr) => {
                        const existing = curr ?? [];
                        if (existing.some((m) => m.id === msg.id)) return existing;
                        return [...existing, msg];
                      });
                    } catch {
                      // ignora JSON inválido
                    }
                  }
                }

                pump();
              })
              .catch(() => {
                // reconecta após 3 s se não for abort
                if (!controller.signal.aborted) {
                  setTimeout(connect, 3000);
                }
              });
          }

          pump();
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setTimeout(connect, 3000);
          }
        });

      return controller;
    }

    const controller = connect();

    return () => {
      controller?.abort();
    };
  }, [conversationId, enabled, qc]);
}
