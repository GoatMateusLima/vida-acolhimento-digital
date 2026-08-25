import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ChatMessage } from "@/types";

/**
 * Conecta ao canal do Supabase Realtime para receber mensagens e
 * eventos de digitação em tempo real, atualizando o TanStack Query.
 */
export function useChatRealtime(conversationId: string, enabled = true) {
  const qc = useQueryClient();
  const [typingUser, setTypingUser] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !conversationId || !supabase) return;

    // Cria/Assina canal para a conversa específica
    const channel = supabase.channel(`conversation:${conversationId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    channel
      .on("broadcast", { event: "message" }, ({ payload }) => {
        if (!payload) return;
        setTypingUser(null);
        const myId = window.localStorage.getItem("vidaplus:user_id");

        const msg: ChatMessage = {
          id: payload.id,
          conversationId: payload.conversation_id ?? conversationId,
          author:
            payload.type === "system" || payload.sender_id == null
              ? "system"
              : payload.sender_id === myId
                ? "user"
                : "volunteer",
          text: payload.body ?? payload.body_encrypted ?? payload.text ?? "",
          createdAt: payload.created_at ?? new Date().toISOString(),
          status: "sent",
          replyToId: payload.reply_to_id || undefined,
        };

        qc.setQueryData<ChatMessage[]>(["messages", conversationId], (curr) => {
          const existing = curr ?? [];
          if (existing.some((m) => m.id === msg.id)) return existing;
          return [...existing, msg];
        });
        // Invalida para buscar a versão oficial do servidor (descriptografada)
        qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (!payload) return;
        const myId = window.localStorage.getItem("vidaplus:user_id");
        if (payload.userId && payload.userId !== myId) {
          if (payload.typing) {
            setTypingUser(payload.alias || "Outra pessoa");
          } else {
            setTypingUser(null);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, enabled, qc]);

  return {
    typingUser,
    isTyping: !!typingUser,
  };
}
