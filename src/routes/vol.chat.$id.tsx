import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CornerUpLeft, MoreHorizontal, X } from "lucide-react";
import { AppShell } from "@/layouts/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { chatService, userService } from "@/services";
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
  const [showRisk, setShowRisk] = useState(false);

  useAuthGuard();

  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => userService.me(),
  });

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
    onError: () => toast.error("Nao foi possivel enviar a mensagem."),
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
      setShowRisk(false);
    },
    onError: () => toast.error("Nao foi possivel registrar a sinalizacao."),
  });

  const endConversation = useMutation({
    mutationFn: (notes?: string) => chatService.endConversation(id, notes),
    onSuccess: () => {
      toast.success("Atendimento registrado e encerrado.");
      navigate({ to: "/vol" });
    },
    onError: () => toast.error("Nao foi possivel encerrar o atendimento."),
  });

  const volunteerName = me.data?.name ?? "Voluntario";
  const initials = volunteerName
    .split(" ")
    .filter(Boolean)
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (ended) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl pt-8">
          <div className="rounded-3xl border bg-card p-8 shadow-soft">
            <h3 className="text-lg font-semibold">Registro do atendimento</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Descreva brevemente a acao tomada (sem dados sensiveis). Este registro fica salvo para consulta futura.
            </p>
            <Textarea
              rows={5}
              className="mt-4"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="Ex: Usuario relatou ansiedade elevada. Ofereci escuta ativa e tecnicas de respiracao."
            />
            <div className="mt-4 flex gap-3">
              <Button
                disabled={endConversation.isPending}
                onClick={() => endConversation.mutate(actionTaken.trim() || undefined)}
              >
                {endConversation.isPending ? "Salvando..." : "Salvar e finalizar"}
              </Button>
              <Button variant="ghost" onClick={() => navigate({ to: "/vol" })}>
                Pular
              </Button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-3 pb-8">
        {/* Card principal — escuro conforme mockup */}
        <div
          className="relative flex flex-col overflow-hidden rounded-3xl shadow-2xl"
          style={{ background: "hsl(30 15% 10%)", minHeight: 520 }}
        >
          {/* Header do voluntario */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ background: "hsl(30 12% 12%)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: "hsl(38 90% 48%)" }}
              >
                {initials}
                <span
                  className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 bg-emerald-400"
                  style={{ borderColor: "hsl(30 12% 12%)" }}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{volunteerName}</p>
                <p className="text-[11px] font-medium" style={{ color: "hsl(38 90% 58%)" }}>
                  online · pronto para acolher
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRisk(!showRisk)}
              className="rounded-xl p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Opcoes"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          {/* Painel de risco colapsavel */}
          {showRisk && (
            <div
              className="border-b px-5 py-4 animate-in fade-in slide-in-from-top-2"
              style={{ background: "hsl(30 12% 13%)", borderColor: "hsl(30 12% 22%)" }}
            >
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">Sinalizar risco</span>
              </div>
              <div className="flex flex-col gap-2">
                <Select value={riskLevel} onValueChange={setRiskLevel}>
                  <SelectTrigger className="h-8 border-white/10 bg-white/5 text-xs text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixo">Baixo</SelectItem>
                    <SelectItem value="medio">Medio</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                    <SelectItem value="imediato">Imediato</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  rows={2}
                  value={riskReason}
                  onChange={(e) => setRiskReason(e.target.value)}
                  placeholder="Descreva o sinal observado..."
                  className="resize-none border-white/10 bg-white/5 text-xs text-white placeholder:text-white/30"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-white/10 text-xs text-white/70 hover:bg-white/10"
                    disabled={riskReason.trim().length < 5 || flagRisk.isPending}
                    onClick={() => flagRisk.mutate()}
                  >
                    {flagRisk.isPending ? "Registrando..." : "Registrar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1 text-xs"
                    onClick={() => setEnded(true)}
                  >
                    Encerrar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Area de mensagens */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-5 py-5"
            aria-live="polite"
            style={{ minHeight: 320 }}
          >
            <div className="flex flex-col gap-4">
              {messages.isPending && (
                <p className="pt-8 text-center text-xs text-white/40">Carregando conversa...</p>
              )}
              {(messages.data ?? []).map((message) => {
                const replyToMessage = message.replyToId
                  ? (messages.data ?? []).find((msg) => msg.id === message.replyToId)
                  : undefined;
                return (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    replyToMessage={replyToMessage}
                    onReply={() => setReplyingTo(message)}
                  />
                );
              })}
              {isTyping && (
                <div className="flex items-center gap-2 animate-in fade-in">
                  <div
                    className="flex items-center gap-1 rounded-2xl px-4 py-2.5"
                    style={{ background: "hsl(30 10% 17%)" }}
                  >
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40" />
                  </div>
                  <span className="text-[10px] text-white/40">
                    {typingUser || "digitando"}...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Barra de input */}
          <div
            className="px-4 py-3"
            style={{ background: "hsl(30 12% 12%)", borderTop: "1px solid hsl(30 12% 18%)" }}
          >
            {replyingTo && (
              <div
                className="mb-2 flex items-center justify-between rounded-xl px-3 py-2 text-xs animate-in fade-in slide-in-from-bottom-1"
                style={{
                  background: "hsl(30 10% 17%)",
                  borderLeft: "2px solid hsl(38 90% 48%)",
                }}
              >
                <div className="pl-2">
                  <span className="block text-[10px] font-semibold text-amber-400">
                    Respondendo a {replyingTo.author === "user" ? "Pessoa acolhida" : "Voce"}
                  </span>
                  <span className="line-clamp-1 text-white/60">{replyingTo.text}</span>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="ml-2 text-white/40 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const value = text.trim();
                if (value) send.mutate({ text: value, replyToId: replyingTo?.id });
              }}
              className="flex items-end gap-2"
            >
              <label htmlFor="volunteer-message" className="sr-only">
                Mensagem
              </label>
              <textarea
                id="volunteer-message"
                rows={1}
                value={text}
                onChange={handleTextChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const value = text.trim();
                    if (value) send.mutate({ text: value, replyToId: replyingTo?.id });
                  }
                }}
                placeholder="Escreva o que esta sentindo..."
                className="max-h-32 flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm outline-none"
                style={{
                  background: "hsl(30 10% 17%)",
                  color: "white",
                  border: "1px solid hsl(30 12% 22%)",
                }}
              />
              <button
                type="submit"
                disabled={!text.trim() || send.isPending}
                className="flex h-10 shrink-0 items-center rounded-2xl px-5 text-sm font-semibold text-black transition-opacity disabled:opacity-40"
                style={{ background: "hsl(38 90% 52%)" }}
                aria-label="Enviar mensagem"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>

        {/* Encerrar fora do card */}
        {!showRisk && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-destructive"
              onClick={() => setEnded(true)}
            >
              Encerrar atendimento
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ChatBubble({
  message,
  replyToMessage,
  onReply,
}: {
  message: ChatMessage;
  replyToMessage?: ChatMessage;
  onReply?: () => void;
}) {
  if (message.author === "system") {
    return (
      <p
        className="my-1 text-center text-[11px]"
        style={{ color: "hsla(0,0%,100%,0.3)" }}
      >
        {message.text}
      </p>
    );
  }

  // "user" = mensagem do usuario acolhido → bolha ambar a direita
  // "volunteer" = mensagem do voluntario → bolha escura a esquerda
  const isUser = message.author === "user";

  return (
    <div className={cn("group flex items-end gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && onReply && (
        <button
          onClick={onReply}
          aria-label="Responder"
          className="mb-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <CornerUpLeft
            className="h-3.5 w-3.5"
            style={{ color: "hsla(0,0%,100%,0.3)" }}
          />
        </button>
      )}

      <div
        className="relative max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm"
        style={
          isUser
            ? {
                background: "hsl(38 90% 52%)",
                color: "#000",
                borderBottomRightRadius: 6,
              }
            : {
                background: "hsl(30 10% 17%)",
                color: "rgba(255,255,255,0.9)",
                borderBottomLeftRadius: 6,
              }
        }
      >
        {replyToMessage && (
          <div
            className="mb-2 rounded-lg p-2 text-xs"
            style={{
              background: isUser ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.06)",
              borderLeft: `2px solid ${isUser ? "rgba(0,0,0,0.3)" : "hsl(38 90% 52%)"}`,
            }}
          >
            <span
              className="mb-0.5 block text-[10px] font-semibold"
              style={{ color: isUser ? "rgba(0,0,0,0.6)" : "hsl(38 90% 58%)" }}
            >
              {replyToMessage.author === "user" ? "Pessoa acolhida" : "Voce"}
            </span>
            <span className="line-clamp-2 opacity-70">{replyToMessage.text}</span>
          </div>
        )}
        <p className="whitespace-pre-wrap text-pretty">{message.text}</p>
        <p
          className="mt-1 text-right text-[10px]"
          style={{ color: isUser ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.3)" }}
        >
          {fmtTime(message.createdAt)}
        </p>
      </div>

      {isUser && onReply && (
        <button
          onClick={onReply}
          aria-label="Responder"
          className="mb-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <CornerUpLeft
            className="h-3.5 w-3.5"
            style={{ color: "hsla(0,0%,100%,0.3)" }}
          />
        </button>
      )}
    </div>
  );
}
