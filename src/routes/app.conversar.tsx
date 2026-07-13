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

export const Route = createFileRoute("/app/conversar")({
  head: () => ({ meta: [{ title: "Conversar agora — VIDA+" }] }),
  component: Page,
});

type Step = "intro" | "waiting" | "found";

function Page() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("intro");
  const [pos, setPos] = useState(3);
  const [eta, setEta] = useState(4);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useAuthGuard();

  const join = useMutation({
    mutationFn: queueService.join,
    onSuccess: (d) => {
      setPos(d.position);
      setEta(d.estimatedWait);
      setConversationId(d.conversationId);
      setStep("waiting");
    },
    onError: () => toast.error("Não foi possível entrar na fila. Tente novamente."),
  });

  // Polling: verifica a cada 5s se um voluntário aceitou (status → "active")
  const poll = useQuery({
    queryKey: ["conversation-status", conversationId],
    queryFn: () => chatService.getConversation(conversationId!),
    enabled: step === "waiting" && !!conversationId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (poll.data?.status === "active") {
      setStep("found");
    }
  }, [poll.data?.status]);

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
            <p className="mt-2 text-sm text-muted-foreground text-pretty">
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
            onClick={() => {
              setStep("intro");
              toast("Você saiu da fila.");
            }}
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
