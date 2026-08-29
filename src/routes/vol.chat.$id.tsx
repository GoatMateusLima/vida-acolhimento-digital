import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CornerUpLeft,
  Send,
  ShieldCheck,
  X,
  MessageSquare,
  Clock,
  Users,
  ArrowLeft,
} from "lucide-react";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { chatService, queueService, userService, volunteerService } from "@/services";
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
import { useChatRealtime } from "@/hooks/useChatRealtime";
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
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  useAuthGuard();

  const messages = useQuery({
    queryKey: ["messages", id],
    queryFn: () => chatService.getMessages(id),
    refetchInterval: 3000,
  });

  const conversation = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => chatService.getConversation(id),
    refetchInterval: 5000,
  });

  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => userService.me(),
  });

  const conversationsQuery = useQuery({
    queryKey: ["conversations"],
    queryFn: () => chatService.getConversations(),
    refetchInterval: 5000,
  });

  const queueQuery = useQuery({
    queryKey: ["queue"],
    queryFn: () => queueService.list(),
    refetchInterval: 5000,
  });

  const teamUsersQuery = useQuery({
    queryKey: ["team-users"],
    queryFn: () => userService.listTeam(),
    refetchInterval: 15000,
  });

  const startTeamChatMutation = useMutation({
    mutationFn: (userId: string) => chatService.startTeamChat(userId),
    onSuccess: (newConv) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      navigate({ to: "/vol/chat/$id", params: { id: newConv.id } });
    },
    onError: () => {
      toast.error("Não foi possível iniciar o chat privado com este membro.");
    },
  });

  const accept = useMutation({
    mutationFn: (qid: string) => volunteerService.accept(qid),
    onSuccess: (d) => navigate({ to: "/vol/chat/$id", params: { id: d.conversationId } }),
    onError: (err: any) => toast.error(err?.message || "Não foi possível aceitar o atendimento."),
  });

  // Tempo real — recebe mensagens e digitação em tempo real do usuário acolhido
  const { typingUser, isTyping } = useChatRealtime(id);

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
    mutationFn: ({ text: val, replyToId }: { text: string; replyToId?: string }) =>
      chatService.sendMessage(id, val, "volunteer", replyToId),
    onMutate: () => {
      setText("");
    },
    onSuccess: (message) => {
      qc.setQueryData<ChatMessage[]>(["messages", id], (current) => {
        const existing = current ?? [];
        if (existing.some((m) => m.id === message.id)) return existing;
        return [...existing, message];
      });
      setReplyingTo(null);
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
    mutationFn: (notes?: string) => chatService.endConversation(id, notes),
    onSuccess: () => {
      toast.success("Atendimento registrado e encerrado.");
      navigate({ to: "/vol" });
    },
    onError: () => toast.error("Não foi possível encerrar o atendimento."),
  });

  // Se for chat de equipe, altera o cabeçalho
  const isTeamChat = conversation.data?.isTeamChat;
  const targetTitle = isTeamChat
    ? `Conversa Interna de Equipe`
    : `Atendimento #${id}`;
  const targetDesc = isTeamChat
    ? `Comunicação interna direta com membros da equipe.`
    : `Conversa ativa. Mantenha tom acolhedor, sem julgamentos.`;

  return (
    <AppShell>
      <PageHeader
        title={targetTitle}
        description={targetDesc}
      />
      {!ended ? (
        <div className="grid min-h-[620px] gap-4 lg:grid-cols-[300px_minmax(0,1fr)_320px]">
          {/* BARRA LATERAL MULTICHAT (ESQUERDA) */}
          <aside className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-soft max-h-[680px] overflow-y-auto">
            <Link to="/vol" className="flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold mb-2">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Painel
            </Link>

            {/* Atendimentos Ativos */}
            <div>
              <h4 className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                <MessageSquare className="h-3.5 w-3.5" /> Ativos ({conversationsQuery.data?.filter(c => c.status === "active" && !c.isTeamChat).length ?? 0})
              </h4>
              <div className="space-y-1">
                {(conversationsQuery.data ?? [])
                  .filter(c => c.status === "active" && !c.isTeamChat)
                  .map(c => (
                    <Link
                      key={c.id}
                      to="/vol/chat/$id"
                      params={{ id: c.id }}
                      className={cn(
                        "block px-3 py-2 text-xs rounded-xl border transition-all hover:bg-muted/40",
                        c.id === id ? "bg-primary/10 border-primary/25 font-semibold text-primary" : "bg-background/50 border-transparent"
                      )}
                    >
                      <p className="truncate font-semibold">{c.userAlias}</p>
                      {c.lastMessage && <p className="truncate text-[10px] text-muted-foreground mt-0.5">{c.lastMessage}</p>}
                    </Link>
                  ))}
                {conversationsQuery.data?.filter(c => c.status === "active" && !c.isTeamChat).length === 0 && (
                  <p className="text-[11px] text-muted-foreground italic px-2">Nenhum atendimento ativo.</p>
                )}
              </div>
            </div>

            {/* Fila Global */}
            <div className="border-t pt-3">
              <h4 className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                <Clock className="h-3.5 w-3.5" /> Fila Global ({queueQuery.data?.length ?? 0})
              </h4>
              <div className="space-y-1">
                {(queueQuery.data ?? []).map(q => (
                  <div key={q.id} className="flex items-center justify-between gap-1 px-3 py-2 text-xs rounded-xl border bg-background/50 border-transparent">
                    <span className="truncate flex-1 font-semibold">{q.alias}</span>
                    <Button
                      size="sm"
                      onClick={() => accept.mutate(q.id)}
                      disabled={accept.isPending}
                      className="h-6 px-2 text-[10px]"
                    >
                      Aceitar
                    </Button>
                  </div>
                ))}
                {(queueQuery.data ?? []).length === 0 && (
                  <p className="text-[11px] text-muted-foreground italic px-2">Fila vazia.</p>
                )}
              </div>
            </div>          </aside>

          <div className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border bg-card shadow-soft">
            <div className="flex items-center gap-3 border-b bg-secondary/35 px-4 py-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {isTeamChat
                    ? (conversation.data?.volunteerAlias === me.data?.nickname
                      ? conversation.data?.userAlias
                      : conversation.data?.volunteerAlias || "Membro da Equipe")
                    : "Pessoa acolhida"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isTeamChat ? "Conversa de Equipe (Segura)" : "Identidade protegida · conversa confidencial"}
                </p>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto bg-background/40 px-4 py-5"
              aria-live="polite"
            >
              <div className="mx-auto flex max-w-2xl flex-col gap-3">
                {(messages.data ?? []).map((message) => {
                  const replyToMessage = message.replyToId
                    ? (messages.data ?? []).find((msg) => msg.id === message.replyToId)
                    : undefined;
                  return (
                    <VolunteerBubble
                      key={message.id}
                      message={message}
                      replyToMessage={replyToMessage}
                      onReply={() => setReplyingTo(message)}
                    />
                  );
                })}
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
                if (value) send.mutate({ text: value, replyToId: replyingTo?.id });
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
              {replyingTo && (
                <div className="mx-auto mb-2 flex max-w-2xl items-center justify-between gap-2 rounded-xl border bg-muted/40 px-3 py-2 text-xs text-muted-foreground animate-in fade-in slide-in-from-bottom-1">
                  <div className="border-l-2 border-primary pl-2">
                    <span className="block font-semibold text-[10px] text-primary">
                      Respondendo a {replyingTo.author === "user" ? "Pessoa acolhida" : "Você"}
                    </span>
                    <span className="line-clamp-1">{replyingTo.text}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 hover:bg-muted"
                    onClick={() => setReplyingTo(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
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
                      if (value) send.mutate({ text: value, replyToId: replyingTo?.id });
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

          {!isTeamChat ? (
            <aside className="h-fit rounded-2xl border bg-card p-5 shadow-soft lg:sticky lg:top-24">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4 text-warning" /> Sinalizar risco
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Use apenas em situações de risco potential. Acionará a moderação.
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
                  onClick={() => setEnded(true)}
                >
                  Encerrar atendimento
                </Button>
              </div>
            </aside>
          ) : (
            <aside className="h-fit rounded-2xl border bg-card p-5 shadow-soft lg:sticky lg:top-24 space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-primary" /> Chat da Equipe
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Este é um canal direto e seguro de comunicação interna para alinhamento de condutas e apoio mútuo.
              </p>
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate({ to: "/vol" })}
                >
                  Voltar ao Início
                </Button>
              </div>
            </aside>
          )}
        </div>
      ) : (
        <div className="max-w-2xl rounded-2xl border bg-card p-6">
          <h3 className="font-semibold">Registro do atendimento</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Descreva brevemente a ação tomada (sem dados sensíveis). Este registro fica salvo para consulta futura.
          </p>
          <Textarea
            rows={5}
            className="mt-3"
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
            placeholder="Ex: Usuário relatou ansiedade elevada. Ofereci escuta ativa e técnicas de respiração. Sem sinalização de risco imediato."
          />
          <div className="mt-4 flex gap-2">
            <Button
              disabled={endConversation.isPending}
              onClick={() => endConversation.mutate(actionTaken.trim() || undefined)}
            >
              {endConversation.isPending ? "Salvando…" : "Salvar e finalizar"}
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

function VolunteerBubble({
  message,
  replyToMessage,
  onReply,
}: {
  message: ChatMessage;
  replyToMessage?: ChatMessage;
  onReply?: () => void;
}) {
  if (message.author === "system") {
    return <p className="my-1 text-center text-xs text-muted-foreground">{message.text}</p>;
  }
  const mine = message.author === "user";
  return (
    <div className={cn("flex group items-end gap-1.5", mine ? "justify-end" : "justify-start")}>
      {/* Bolha */}
      <div
        className={cn(
          "relative max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
          mine
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm border bg-card",
        )}
      >
        {replyToMessage && (
          <div className={cn(
            "mb-1.5 rounded border-l-2 p-1.5 text-xs",
            mine
              ? "border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground/90"
              : "border-primary/40 bg-muted/60 text-muted-foreground"
          )}>
            <span className={cn(
              "block font-semibold text-[10px]",
              mine ? "text-primary-foreground/80" : "text-primary"
            )}>
              {replyToMessage.author === "user" ? "Pessoa acolhida" : "Você"}
            </span>
            <span className="line-clamp-2">{replyToMessage.text}</span>
          </div>
        )}
        <p className="whitespace-pre-wrap text-pretty">{message.text}</p>
        <p
          className={cn(
            "mt-0.5 text-[10px]",
            mine ? "text-right text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {fmtTime(message.createdAt)}
        </p>
      </div>
      {/* Botão de responder — aparece ao passar o mouse */}
      {onReply && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onReply}
          aria-label="Responder mensagem"
          className="h-7 w-7 shrink-0 rounded-full text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-50 hover:text-foreground hover:bg-muted"
        >
          <CornerUpLeft className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
