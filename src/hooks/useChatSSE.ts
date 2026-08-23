import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL, getAccessToken } from "@/services/api/client";
import type { ChatMessage } from "@/types";

/**
 * Conecta ao SSE de mensagens de uma conversa e atualiza o cache do TanStack Query
 * automaticamente quando novas mensagens ou eventos de digitação chegam.
 */
export function useChatSSE(conversationId: string, enabled = true) {
  const qc = useQueryClient();
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);

  useEffect(() => {
    if (!enabled || !conversationId) return;

    let controller = new AbortController();
    let isMounted = true;

    function connect() {
      const token = getAccessToken();
      if (!token) return;

      const url = `${API_BASE_URL}/conversations/${conversationId}/events`;
      
      fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error("Connection failed");
          if (!res.body) throw new Error("No body");

          attemptRef.current = 0; // Reset backoff on success
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
                  if (eventType === "error") continue;

                  if (eventType === "typing") {
                    try {
                      const raw = JSON.parse(dataLine);
                      const myId = window.localStorage.getItem("vidaplus:user_id");
                      if (raw.userId && raw.userId !== myId) {
                        if (raw.typing) {
                          setTypingUser(raw.alias || "Outra pessoa");
                          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
                          typingTimerRef.current = setTimeout(() => {
                            setTypingUser(null);
                          }, 4000);
                        } else {
                          setTypingUser(null);
                        }
                      }
                    } catch {}
                    continue;
                  }

                  if (eventType === "message") {
                    try {
                      const raw = JSON.parse(dataLine);
                      setTypingUser(null);
                      const msg: ChatMessage = {
                        id: raw.id,
                        conversationId: raw.conversation_id ?? conversationId,
                        author:
                          raw.type === "system" || raw.sender_id == null
                            ? "system"
                            : raw.sender_id === window.localStorage.getItem("vidaplus:user_id")
                              ? "user"
                              : "volunteer",
                        text: raw.body ?? raw.body_encrypted ?? raw.text ?? "",
                        createdAt: raw.created_at ?? new Date().toISOString(),
                        status: "sent",
                      };

                      qc.setQueryData<ChatMessage[]>(["messages", conversationId], (curr) => {
                        const existing = curr ?? [];
                        if (existing.some((m) => m.id === msg.id)) return existing;
                        return [...existing, msg];
                      });
                    } catch {}
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
        .catch(() => {
          if (isMounted) handleReconnect();
        });
    }

    function handleReconnect() {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      const delay = Math.min(1000 * Math.pow(2, attemptRef.current), 30000);
      attemptRef.current += 1;
      reconnectTimerRef.current = setTimeout(() => {
        controller.abort();
        controller = new AbortController();
        connect();
      }, delay);
    }

    connect();

    return () => {
      isMounted = false;
      controller.abort();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [conversationId, enabled, qc]);

  return {
    typingUser,
    isTyping: !!typingUser,
  };
}
