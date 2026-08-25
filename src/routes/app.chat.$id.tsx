import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CornerUpLeft, Send, ShieldAlert, X } from "lucide-react";
import { AppShell } from "@/layouts/AppShell";
import { Button } from "@/components/ui/button";
import { chatService } from "@/services";
import { fmtTime } from "@/utils/format";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ChatMessage } from "@/types";
import { toast } from "sonner";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useChatRealtime } from "@/hooks/useChatRealtime";

export const Route = createFileRoute("/app/chat/$id")({
  head: () => ({ meta: [{ title: "Conversa — VIDA+" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [endOpen, setEndOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

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

  // Tempo real — recebe mensagens e eventos de digitação em tempo real do voluntário
  const { typingUser, isTyping } = useChatRealtime(id);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.data?.length]);

  useEffect(() => {
    if (conversation.data?.status === "ended") {
      toast.info("Esta conversa foi encerrada pelo voluntário.");
      navigate({ to: "/app" });
    }
  }, [conversation.data?.status]);

  const send = useMutation({
    mutationFn: ({ text, replyToId }: { text: string; replyToId?: string }) =>
      chatService.sendMessage(id, text, "user", replyToId),
    onMutate: async ({ text: t, replyToId }) => {
      const tempId = `tmp-${Date.now()}`;
      await qc.cancelQueries({ queryKey: ["messages", id] });
      const prev = qc.getQueryData<ChatMessage[]>(["messages", id]) ?? [];
      qc.setQueryData<ChatMessage[]>(
        ["messages", id],
        [
          ...prev,
          {
            id: tempId,
            conversationId: id,
            author: "user",
            text: t,
            createdAt: new Date().toISOString(),
            status: "sending",
            replyToId,
          },
        ],
      );
      return { tempId, prev };
    },
    onSuccess: (msg, _variables, ctx) => {
      qc.setQueryData<ChatMessage[]>(["messages", id], (curr) => {
        const list = curr ?? [];
        if (list.some((m) => m.id === msg.id)) {
          return list.filter((m) => m.id !== ctx?.tempId);
        }
        return list.map((m) => (m.id === ctx?.tempId ? msg : m));
      });
      setReplyingTo(null);
    },
    onError: (_e, _variables, ctx) => {
      qc.setQueryData<ChatMessage[]>(["messages", id], (curr) =>
        (curr ?? []).map((m) => (m.id === ctx?.tempId ? { ...m, status: "error" } : m)),
      );
      toast.error("Não foi possível enviar. Toque para reenviar.");
    },
  });

  const endConversation = useMutation({
    mutationFn: () => chatService.endConversation(id),
    onSuccess: () => {
      toast.success("Conversa encerrada.");
      navigate({ to: "/app" });
    },
    onError: () => toast.error("Não foi possível encerrar. Tente novamente."),
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    if (val.trim()) {
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

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    if (typingTimer.current) clearTimeout(typingTimer.current);
    isTypingRef.current = false;
    chatService.sendTyping(id, false);
    send.mutate({ text: t, replyToId: replyingTo?.id });
  };

  return (
    <AppShell>
      <div className="-mx-4 -my-6 flex h-[calc(100dvh-56px)] flex-col md:-mx-8 md:-my-6 md:h-[calc(100dvh-72px)]">
        {/* Status bar */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b bg-card px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {conversation.data?.volunteerAlias
                ? `VOLUNTARIO ${conversation.data.volunteerAlias.replace(/^voluntário$/i, "")}`.trim()
                : "VOLUNTARIO"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Conversa em andamento · confidencial
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: "/app/denuncia" })}
              className="h-9 gap-1.5 text-destructive"
            >
              <ShieldAlert className="h-4 w-4" />
              <span className="hidden sm:inline">Denunciar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEndOpen(true)}
              className="h-9 gap-1.5"
            >
              <X className="h-4 w-4" /> Encerrar
            </Button>
          </div>
        </div>

        {/* Privacy note */}
        <p role="note" className="bg-muted/50 px-4 py-2 text-center text-xs text-muted-foreground">
          Esta conversa é confidencial. VIDA+ oferece escuta, não diagnóstico médico.
        </p>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4" aria-live="polite">
          <div className="mx-auto flex max-w-2xl flex-col gap-2.5">
            {(messages.data ?? []).map((m) => {
              const replyToMessage = m.replyToId
                ? (messages.data ?? []).find((msg) => msg.id === m.replyToId)
                : undefined;
              return (
                <Bubble
                  key={m.id}
                  message={m}
                  replyToMessage={replyToMessage}
                  onRetry={() => send.mutate({ text: m.text, replyToId: m.replyToId })}
                  onReply={() => setReplyingTo(m)}
                />
              );
            })}
            {messages.isPending && (
              <p className="text-center text-xs text-muted-foreground">Carregando…</p>
            )}
          </div>
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="border-t bg-card p-3 safe-bottom"
        >
          {isTyping && (
            <div className="mx-auto mb-2 flex max-w-2xl items-center gap-2 rounded-xl bg-primary/10 px-3 py-1.5 text-xs text-primary animate-in fade-in slide-in-from-bottom-1">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
              </span>
              <span className="font-medium">{typingUser || "Voluntário"} está digitando...</span>
            </div>
          )}
          {replyingTo && (
            <div className="mx-auto mb-2 flex max-w-2xl items-center justify-between gap-2 rounded-xl border bg-muted/40 px-3 py-2 text-xs text-muted-foreground animate-in fade-in slide-in-from-bottom-1">
              <div className="border-l-2 border-primary pl-2">
                <span className="block font-semibold text-[10px] text-primary">
                  Respondendo a {replyingTo.author === "user" ? "Você" : "Voluntário"}
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
            <label htmlFor="msg" className="sr-only">
              Mensagem
            </label>
            <textarea
              id="msg"
              value={text}
              onChange={handleTextChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              placeholder="Escreva como está se sentindo…"
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border bg-background px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button
              type="submit"
              size="icon"
              className="h-11 w-11 shrink-0"
              aria-label="Enviar mensagem"
              disabled={!text.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>

      <AlertDialog open={endOpen} onOpenChange={setEndOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao encerrar, esta conversa será finalizada. Você poderá iniciar uma nova quando
              quiser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar conversando</AlertDialogCancel>
            <AlertDialogAction
              disabled={endConversation.isPending}
              onClick={() => endConversation.mutate()}
            >
              {endConversation.isPending ? "Encerrando…" : "Encerrar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function Bubble({
  message,
  replyToMessage,
  onRetry,
  onReply,
}: {
  message: ChatMessage;
  replyToMessage?: ChatMessage;
  onRetry: () => void;
  onReply?: () => void;
}) {
  if (message.author === "system") {
    return <p className="my-2 text-center text-xs text-muted-foreground">{message.text}</p>;
  }
  const mine = message.author === "user";
  return (
    <div className={cn("flex group items-center gap-2", mine ? "justify-end flex-row" : "justify-start flex-row-reverse")}>
      {onReply && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onReply}
          className="opacity-0 group-hover:opacity-100 max-md:opacity-60 transition-opacity h-8 w-8 rounded-full shrink-0 text-muted-foreground hover:text-foreground"
        >
          <CornerUpLeft className="h-4 w-4" />
        </Button>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-soft relative",
          mine ? "bg-primary text-primary-foreground" : "bg-card border",
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
              {replyToMessage.author === "user" ? "Você" : "Voluntário"}
            </span>
            <span className="line-clamp-2">{replyToMessage.text}</span>
          </div>
        )}
        <p className="whitespace-pre-wrap text-pretty">{message.text}</p>
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-[10px]",
            mine ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          <span>{fmtTime(message.createdAt)}</span>
          {message.status === "sending" && <span>· enviando…</span>}
          {message.status === "error" && (
            <button onClick={onRetry} className="ml-1 underline">
              Falhou — reenviar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
