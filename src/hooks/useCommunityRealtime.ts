import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CommunityMessage } from "@/types";

export interface OnlineUser {
  userId: string;
  alias: string;
  role?: string;
}

/**
 * Conecta ao canal de tempo real de uma comunidade usando o Supabase.
 * Usa Broadcast para mensagens e Presence para usuários online e digitação.
 */
export function useCommunityRealtime(communityId: string, myAlias?: string, enabled = true) {
  const qc = useQueryClient();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; alias: string }>>([]);

  useEffect(() => {
    if (!enabled || !communityId || !supabase) return;

    const myId = window.localStorage.getItem("vidaplus:user_id") || "anon";

    const channel = supabase.channel(`community:${communityId}`, {
      config: {
        presence: {
          key: myId,
        },
      },
    });

    channel
      .on("broadcast", { event: "message" }, ({ payload }) => {
        if (!payload) return;

        // Remove da lista de digitando ao receber mensagem
        if (payload.sender_id) {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== payload.sender_id));
        }

        const msg: CommunityMessage = {
          id: payload.id,
          communityId: payload.community_id ?? communityId,
          alias: payload.alias ?? payload.alias_snapshot ?? "Participante",
          text: payload.body ?? payload.text ?? payload.body_encrypted ?? "",
          createdAt: payload.created_at ?? new Date().toISOString(),
          isMine: payload.sender_id === myId || payload.is_mine,
          reported: payload.reported,
        };

        qc.setQueryData<CommunityMessage[]>(
          ["community-messages", communityId],
          (curr) => {
            const existing = curr ?? [];
            if (existing.some((m) => m.id === msg.id)) return existing;
            return [...existing, msg];
          },
        );
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const usersList: OnlineUser[] = [];
        const typingList: Array<{ userId: string; alias: string }> = [];

        Object.values(state).forEach((presences) => {
          presences.forEach((p: any) => {
            // Adiciona na lista de online
            if (p.userId) {
              usersList.push({
                userId: p.userId,
                alias: p.alias,
                role: p.role,
              });

              // Adiciona na lista de digitando (se for outra pessoa)
              if (p.typing && p.userId !== myId) {
                typingList.push({
                  userId: p.userId,
                  alias: p.alias,
                });
              }
            }
          });
        });

        setOnlineUsers(usersList);
        setTypingUsers(typingList);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Registra presença local no Supabase Realtime
          await channel.track({
            userId: myId,
            alias: myAlias || "Participante",
            role: "user",
            typing: false,
          });
        }
      });

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [communityId, myAlias, enabled, qc]);

  // Função para expor a mudança de estado de digitação local para o Presence
  const sendTypingStatus = async (typing: boolean) => {
    if (!communityId || !supabase) return;
    const myId = window.localStorage.getItem("vidaplus:user_id") || "anon";
    const channel = supabase.channel(`community:${communityId}`);
    await channel.track({
      userId: myId,
      alias: myAlias || "Participante",
      role: "user",
      typing,
    });
  };

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
    sendTypingStatus,
  };
}
