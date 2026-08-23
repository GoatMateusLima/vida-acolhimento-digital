import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Clock, Heart, X } from "lucide-react";
import { AppShell } from "@/layouts/AppShell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { chatService, queueService } from "@/services";
import { toast } from "sonner";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { API_BASE_URL, getAccessToken } from "@/services/api/client";

export const Route = createFileRoute("/app/conversar")({
  head: () => ({ meta: [{ title: "Conversar agora — VIDA+" }] }),
  component: Page,
});

type Step = "intro" | "waiting" | "found";

function Page() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("intro");
  const [pos, setPos] = useState(1);
  const [eta, setEta] = useState(4);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useAuthGuard();

  // Consulta conversas ativas do usuário para restaurar estado se já estiver aguardando/em atendimento
  const existingConv = useQuery({
    queryKey: ["conversations"],
    queryFn: chatService.getConversations,
  });

  useEffect(() => {
    if (step === "intro" && existingConv.data) {
      const openConv = existingConv.data.find(
        (c) => c.status === "waiting" || c.status === "active"
      );
      if (openConv) {
        setConversationId(openConv.id);
        if (openConv.status === "active") {
          setStep("found");
        } else {
          setStep("waiting");
        }
      }
    }
  }, [existingConv.data, step]);

  const join = useMutation({
    mutationFn: queueService.join,
    onSuccess: (d) => {
      setPos(d.position);
      setEta(d.estimatedWait);
      setConversationId(d.conversationId);
      setStep("waiting");
    },
    onError: (err: Error) =>
      toast.error(err?.message || "Não foi possível entrar na fila. Tente novamente."),
  });

  const cancel = useMutation({
    mutationFn: () => queueService.cancel(conversationId ?? undefined),
    onSuccess: () => {
      setStep("intro");
      setConversationId(null);
      toast("Você saiu da fila.");
    },
    onError: () => {
      setStep("intro");
      setConversationId(null);
    },
  });

  // Polling: verifica a cada 4s se um voluntário aceitou (status → "active")
  const poll = useQuery({
    queryKey: ["conversation-status", conversationId],
    queryFn: () => chatService.getConversation(conversationId!),
    enabled: step === "waiting" && !!conversationId,
    refetchInterval: 4000,
  });

  useEffect(() => {
    if (poll.data?.status === "active") {
      setStep("found");
    }
  }, [poll.data?.status]);

  // Escuta em tempo real pelo SSE para transição imediata ao aceitar
  useEffect(() => {
    if (step !== "waiting" || !conversationId) return;

    const token = getAccessToken();
    if (!token) return;

    const controller = new AbortController();
    const url = `${API_BASE_URL}/conversations/${conversationId}/events`;

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
          reader.read().then(({ done, value }) => {
            if (done || controller.signal.aborted) return;
            buffer += decoder.decode(value, { stream: true });
            const blocks = buffer.split("\n\n");
            buffer = blocks.pop() ?? "";

            for (const block of blocks) {
              let eventType = "";
              for (const line of block.split("\n")) {
                if (line.startsWith("event:")) {
                  eventType = line.replace("event:", "").trim();
                }
              }
              if (eventType === "accepted") {
                setStep("found");
                return; // Encerra loop local
              }
            }
            pump();
          }).catch(() => {});
        }
        pump();
      })
      .catch(() => {});

    return () => {
      controller.abort();
    };
  }, [step, conversationId]);

  // Fallback de posição decrescente enquanto espera
  useEffect(() => {
    if (step !== "waiting") return;
    const t = setInterval(() => setPos((p) => Math.max(1, p - 1)), 15000);
    return () => clearInterval(t);
  }, [step]);

  return (
    <AppShell>
      <PageHeader
        title="Conversar agora"
        description="Você está a alguns instantes de uma escuta acolhedora."
      />

      {step === "intro" && (
        <div className="grid gap-6 md:grid-cols-[1fr_auto]">
          <div className="rounded-3xl border bg-card p-6 shadow-soft">
            <Heart className="h-7 w-7 text-primary" />
            <h2 className="mt-3 font-display text-2xl font-semibold">Pronto para começar?</h2>
            <p className="mt-2 text-pretty text-sm text-muted-foreground">
              Sua conversa é anônima e confidencial. Você pode encerrá-la a qualquer momento.
            </p>
            <Button
              onClick={() => join.mutate()}
              disabled={join.isPending}
              size="lg"
              className="mt-6 h-12 px-6"
            >
              {join.isPending ? "Entrando…" : "Entrar na fila"}
            </Button>
          </div>
        </div>
      )}

      {step === "waiting" && (
        <div className="rounded-3xl border bg-card p-8 text-center shadow-soft">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/15 text-primary">
            <Clock className="h-9 w-9 animate-pulse" aria-hidden="true" />
          </div>
          <h2 className="mt-5 font-display text-2xl font-semibold">Aguardando voluntário</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sua posição na fila: <strong>{pos}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Tempo estimado: <strong>{eta} min</strong>
          </p>
          <Button
            variant="outline"
            className="mt-6 gap-2"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate()}
          >
            <X className="h-4 w-4" /> Cancelar espera
          </Button>
        </div>
      )}

      {step === "found" && (
        <div className="rounded-3xl border bg-card p-8 text-center shadow-soft">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary text-primary-foreground">
            <Heart className="h-9 w-9" aria-hidden="true" />
          </div>
          <h2 className="mt-5 font-display text-2xl font-semibold">Voluntário encontrado 💚</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {poll.data?.volunteerAlias
              ? `${poll.data.volunteerAlias} está pronto para te escutar.`
              : "Um voluntário está pronto para te escutar."}
          </p>
          <Button
            onClick={() => navigate({ to: "/app/chat/$id", params: { id: conversationId ?? "" } })}
            disabled={!conversationId}
            size="lg"
            className="mt-6 h-12 px-6"
          >
            Entrar na conversa
          </Button>
        </div>
      )}
    </AppShell>
  );
}
