import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL, getAccessToken } from "@/services/api/client";
import type { CommunityMessage } from "@/types";

export interface OnlineUser {
  userId: string;
  alias: string;
  role?: string;
}

/**
 * Conecta ao SSE de uma comunidade com reconexão automática robusta
 * (backoff exponencial). Funciona corretamente quando o servidor
 * Render hiberna ou reinicia.
 *
 * Comportamentos garantidos:
 *  - done=true (servidor fechou limpamente) → reconecta com backoff
 *  - !res.ok (servidor acordando: 502/503)  → reconecta com backoff
 *  - fetch falha (rede/servidor offline)    → reconecta com backoff
 *  - Desmontagem do componente              → abort + limpa todos os timers
 *  - Conexão bem-sucedida                   → delay volta ao valor inicial
 */
export function useCommunitySSE(communityId: string, myAlias?: string, enabled = true) {
  const qc = useQueryClient();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; alias: string }>>([]);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);

  useEffect(() => {
    if (!enabled || !communityId) return;

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
      if (!token) return;

      const aliasQuery = myAlias ? `?alias=${encodeURIComponent(myAlias)}` : "";
      const url = `${API_BASE_URL}/communities/${communityId}/events${aliasQuery}`;

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
                  if (eventType === "error") continue; // encerramento intencional

                  if (eventType === "presence") {
                    try {
                      const raw = JSON.parse(dataLine);
                      if (Array.isArray(raw.users)) {
                        setOnlineUsers(raw.users);
                      }
                    } catch {
                      // ignora
                    }
                    continue;
                  }

                  if (eventType === "typing") {
                    try {
                      const raw = JSON.parse(dataLine);
                      const myId = window.localStorage.getItem("vidaplus:user_id");

                      if (Array.isArray(raw.typingUsers)) {
                        const others = raw.typingUsers.filter(
                          (u: { userId: string }) => u.userId !== myId
                        );
                        setTypingUsers(others);
                      } else if (raw.userId && raw.userId !== myId) {
                        if (raw.typing) {
                          setTypingUsers((prev) => {
                            const exists = prev.some((u) => u.userId === raw.userId);
                            if (exists) return prev;
                            return [...prev, { userId: raw.userId, alias: raw.alias || "Participante" }];
                          });
                        } else {
                          setTypingUsers((prev) => prev.filter((u) => u.userId !== raw.userId));
                        }
                      }

                      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
                      typingTimerRef.current = setTimeout(() => {
                        setTypingUsers([]);
                      }, 4000);
                    } catch {
                      // ignora
                    }
                    continue;
                  }

                  if (eventType === "message") {
                    try {
                      const raw = JSON.parse(dataLine);
                      const myId = window.localStorage.getItem("vidaplus:user_id");

                      // Remove o usuário da lista de digitando ao enviar mensagem
                      if (raw.sender_id) {
                        setTypingUsers((prev) => prev.filter((u) => u.userId !== raw.sender_id));
                      }

                      const msg: CommunityMessage = {
                        id: raw.id,
                        communityId: raw.community_id ?? communityId,
                        alias: raw.alias ?? raw.alias_snapshot ?? "Participante",
                        text: raw.body ?? raw.text ?? raw.body_encrypted ?? "",
                        createdAt: raw.created_at ?? new Date().toISOString(),
                        isMine: raw.sender_id === myId || raw.is_mine,
                        reported: raw.reported,
                      };

                      qc.setQueryData<CommunityMessage[]>(
                        ["community-messages", communityId],
                        (curr) => {
                          const existing = curr ?? [];
                          if (existing.some((m) => m.id === msg.id)) return existing;
                          return [...existing, msg];
                        }
                      );
                    } catch {
                      // ignora
                    }
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
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [communityId, myAlias, enabled, qc]);

  // Formata o texto de quem está digitando
  let typingText = "";
  if (typingUsers.length === 1) {
    typingText = `${typingUsers[0].alias} está digitando...`;
  } else if (typingUsers.length === 2) {
    typingText = `${typingUsers[0].alias} e ${typingUsers[1].alias} estão digitando...`;
  } else if (typingUsers.length > 2) {
    typingText = `${typingUsers[0].alias} e outras ${typingUsers.length - 1} pessoas estão digitando...`;
  }

  return {
    onlineUsers,
    onlineCount: onlineUsers.length,
    typingUsers,
    typingText,
    isTyping: typingUsers.length > 0,
  };
}
