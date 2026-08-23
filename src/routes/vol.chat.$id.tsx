import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Send, ShieldCheck } from "lucide-react";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { chatService } from "@/services";
import { fmtTime } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useChatSSE } from "@/hooks/useChatSSE";
import { http } from "@/services/api/client";

export const Route = createFileRoute("/vol/chat/$id")({
  head: () => ({ meta: [{ title: "Atendimento — VIDA+" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const [text, setText] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [riskLevel, setRiskLevel] = useState("baixo");
  const [riskReason, setRiskReason] = useState("");
  const [ended, setEnded] = useState(false);

  useAuthGuard();

  const messages = useQuery({
    queryKey: ["messages", id],
    queryFn: () => chatService.getMessages(id),
  });

  const conversation = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => chatService.getConversation(id),
    refetchInterval: 5000,
  });

  // SSE — recebe mensagens e digitação em tempo real do usuário acolhido
  const { typingUser, isTyping } = useChatSSE(id);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.data?.length]);

  useEffect(() => {
    if (conversation.data?.status === "ended" && !ended) {
      setEnded(true);
      toast.info("A conversa foi encerrada pela pessoa acolhida.");
    }
  }, [conversation.data?.status, ended]);

  const send = useMutation({
    mutationFn: (value: string) => chatService.sendMessage(id, value, "volunteer"),
    onMutate: () => {
      setText("");
    },
    onSuccess: (message) => {
      qc.setQueryData<ChatMessage[]>(["messages", id], (current) => {
        const existing = current ?? [];
        if (existing.some((m) => m.id === message.id)) return existing;
        return [...existing, message];
      });
      if (typingTimer.current) clearTimeout(typingTimer.current);
      isTypingRef.current = false;
      chatService.sendTyping(id, false);
    },
    onError: () => toast.error("Não foi possível enviar a mensagem."),
  });

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setText(value);
    if (value.trim()) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        chatService.sendTyping(id, true);
      }
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        isTypingRef.current = false;
        chatService.sendTyping(id, false);
      }, 2500);
    } else {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        if (typingTimer.current) clearTimeout(typingTimer.current);
        chatService.sendTyping(id, false);
      }
    }
  };

  const flagRisk = useMutation({
    mutationFn: () =>
      http(`/conversations/${id}/risk-flags`, {
        method: "POST",
        body: JSON.stringify({ level: riskLevel, reason: riskReason }),
      }),
    onSuccess: () => {
      toast.warning(`Risco ${riskLevel} registrado. Equipe notificada.`);
      setRiskReason("");
    },
    onError: () => toast.error("Não foi possível registrar a sinalização."),
  });

  const endConversation = useMutation({
    mutationFn: () => chatService.endConversation(id),
    onSuccess: () => {
      toast.success("Atendimento encerrado.");
      setEnded(true);
    },
    onError: () => toast.error("Não foi possível encerrar o atendimento."),
  });

  return (
    <AppShell>
      <PageHeader
        title={`Atendimento #${id}`}
        description="Conversa ativa. Mantenha tom acolhedor, sem julgamentos."
      />
      {!ended ? (
        <div className="grid min-h-[620px] gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border bg-card shadow-soft">
            <div className="flex items-center gap-3 border-b bg-secondary/35 px-4 py-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Pessoa acolhida</p>
                <p className="text-xs text-muted-foreground">
                  Identidade protegida · conversa confidencial
                </p>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto bg-background/40 px-4 py-5"
              aria-live="polite"
            >
              <div className="mx-auto flex max-w-2xl flex-col gap-3">
                {(messages.data ?? []).map((message) => (
                  <VolunteerBubble key={message.id} message={message} />
                ))}
                {messages.isPending && (
                  <p className="text-center text-xs text-muted-foreground">
                    Carregando conversa...
                  </p>
                )}
              </div>
            </div>

            <form
              className="border-t bg-card p-3"
              onSubmit={(event) => {
                event.preventDefault();
                const value = text.trim();
                if (value) send.mutate(value);
              }}
            >
              {isTyping && (
                <div className="mx-auto mb-2 flex max-w-2xl items-center gap-2 rounded-xl bg-primary/10 px-3 py-1.5 text-xs text-primary animate-in fade-in slide-in-from-bottom-1">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                  </span>
                  <span className="font-medium">{typingUser || "Pessoa acolhida"} está digitando...</span>
                </div>
              )}
              <div className="mx-auto flex max-w-2xl items-end gap-2">
                <label htmlFor="volunteer-message" className="sr-only">
                  Mensagem
                </label>
                <Textarea
                  id="volunteer-message"
                  rows={1}
                  value={text}
                  onChange={handleTextChange}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      const value = text.trim();
                      if (value) send.mutate(value);
                    }
                  }}
                  placeholder="Responda com acolhimento..."
                  className="max-h-32 min-h-11 resize-none rounded-2xl"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-full"
                  disabled={!text.trim() || send.isPending}
                  aria-label="Enviar mensagem"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </div>

          <aside className="h-fit rounded-2xl border bg-card p-5 shadow-soft lg:sticky lg:top-24">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-warning" /> Sinalizar risco
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Use apenas em situações de risco potencial. Acionará a moderação.
            </p>
            <Select value={riskLevel} onValueChange={setRiskLevel}>
              <SelectTrigger className="mt-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixo">Baixo</SelectItem>
                <SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="alto">Alto</SelectItem>
                <SelectItem value="imediato">Imediato</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              className="mt-3"
              rows={4}
              value={riskReason}
              onChange={(event) => setRiskReason(event.target.value)}
              placeholder="Descreva objetivamente o sinal observado"
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              disabled={riskReason.trim().length < 5 || flagRisk.isPending}
              onClick={() => flagRisk.mutate()}
            >
              {flagRisk.isPending ? "Registrando…" : "Registrar sinalização"}
            </Button>

            <div className="mt-6 border-t pt-4">
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                disabled={endConversation.isPending}
                onClick={() => endConversation.mutate()}
              >
                {endConversation.isPending ? "Encerrando…" : "Encerrar atendimento"}
              </Button>
            </div>
          </aside>
        </div>
      ) : (
        <div className="max-w-2xl rounded-2xl border bg-card p-6">
          <h3 className="font-semibold">Registro do atendimento</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Descreva brevemente a ação tomada (sem dados sensíveis).
          </p>
          <Textarea
            rows={5}
            className="mt-3"
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
          />
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => {
                toast.success("Atendimento registrado.");
                navigate({ to: "/vol" });
              }}
            >
              Salvar e finalizar
            </Button>
            <Button variant="ghost" onClick={() => navigate({ to: "/vol" })}>
              Pular
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function VolunteerBubble({ message }: { message: ChatMessage }) {
  if (message.author === "system") {
    return <p className="my-1 text-center text-xs text-muted-foreground">{message.text}</p>;
  }
  const mine = message.author === "user";
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm",
          mine ? "bg-primary text-primary-foreground" : "border bg-card",
        )}
      >
        <p className="whitespace-pre-wrap text-pretty">{message.text}</p>
        <p
          className={cn(
            "mt-1 text-[10px]",
            mine ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {fmtTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
