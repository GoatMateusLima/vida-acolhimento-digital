import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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
 * Mantém o voluntário conectado ao canal do Supabase Realtime para a fila global.
 * Atualiza automaticamente o cache TanStack Query ["queue"] em tempo real.
 */
export function useVolunteerQueueRealtime(enabled = true) {
  const qc = useQueryClient();

  const refetchQueue = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["queue"] });
  }, [qc]);

  useEffect(() => {
    if (!enabled) return;

    // Invalida a query ao conectar para garantir fila atualizada
    refetchQueue();

    const channel = supabase.channel("volunteer:queue", {
      config: {
        broadcast: { self: false },
      },
    });

    channel
      .on("broadcast", { event: "queue_snapshot" }, ({ payload }) => {
        try {
          if (Array.isArray(payload)) {
            qc.setQueryData<QueueEntry[]>(["queue"], payload.map(mapQueueEntry));
          }
        } catch {}
      })
      .on("broadcast", { event: "queue_entry" }, ({ payload }) => {
        try {
          if (payload) {
            const entry = mapQueueEntry(payload);
            qc.setQueryData<QueueEntry[]>(["queue"], (curr) => {
              const existing = curr ?? [];
              if (existing.some((e) => e.id === entry.id)) return existing;
              return [...existing, entry];
            });
          }
        } catch {}
      })
      .on("broadcast", { event: "queue_remove" }, ({ payload }) => {
        try {
          if (payload && payload.id) {
            qc.setQueryData<QueueEntry[]>(["queue"], (curr) =>
              (curr ?? []).filter((e) => e.id !== payload.id),
            );
          }
        } catch {}
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, qc, refetchQueue]);

  return { refetchQueue };
}
