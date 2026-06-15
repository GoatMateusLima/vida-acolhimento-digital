import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, ShieldAlert, X } from "lucide-react";
import { AppShell } from "@/layouts/AppShell";
import { Button } from "@/components/ui/button";
import { chatService } from "@/services";
import { fmtTime } from "@/utils/format";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ChatMessage } from "@/types";
import { toast } from "sonner";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useQuery({
    queryKey: ["messages", id],
    queryFn: () => chatService.getMessages(id),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.data?.length]);

  const send = useMutation({
    mutationFn: (t: string) => chatService.sendMessage(id, t, "user"),
    onMutate: async (t) => {
      const tempId = `tmp-${Date.now()}`;
      await qc.cancelQueries({ queryKey: ["messages", id] });
      const prev = qc.getQueryData<ChatMessage[]>(["messages", id]) ?? [];
      qc.setQueryData<ChatMessage[]>(["messages", id], [...prev, {
        id: tempId, conversationId: id, author: "user", text: t,
        createdAt: new Date().toISOString(), status: "sending",
      }]);
      return { tempId, prev };
    },
    onSuccess: (msg, _t, ctx) => {
      qc.setQueryData<ChatMessage[]>(["messages", id], (curr) =>
        (curr ?? []).map((m) => (m.id === ctx?.tempId ? msg : m))
      );
    },
    onError: (_e, _t, ctx) => {
      qc.setQueryData<ChatMessage[]>(["messages", id], (curr) =>
        (curr ?? []).map((m) => (m.id === ctx?.tempId ? { ...m, status: "error" } : m))
      );
      toast.error("Não foi possível enviar. Toque para reenviar.");
    },
  });

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    send.mutate(t);
  };

  return (
    <AppShell>
      <div className="-mx-4 -my-6 flex h-[calc(100dvh-56px)] flex-col md:-mx-8 md:-my-6 md:h-[calc(100dvh-72px)]">
        {/* Status bar */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b bg-card px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Voluntário C.</p>
            <p className="truncate text-xs text-muted-foreground">Conversa em andamento · confidencial</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/app/denuncia" })} className="h-9 gap-1.5 text-destructive">
              <ShieldAlert className="h-4 w-4" /> <span className="hidden sm:inline">Denunciar</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEndOpen(true)} className="h-9 gap-1.5">
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
            {(messages.data ?? []).map((m) => (
              <Bubble key={m.id} message={m} onRetry={() => send.mutate(m.text)} />
            ))}
            {messages.isPending && <p className="text-center text-xs text-muted-foreground">Carregando…</p>}
          </div>
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="border-t bg-card p-3 safe-bottom"
        >
          <div className="mx-auto flex max-w-2xl items-end gap-2">
            <label htmlFor="msg" className="sr-only">Mensagem</label>
            <textarea
              id="msg"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              rows={1}
              placeholder="Escreva como está se sentindo…"
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border bg-background px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0" aria-label="Enviar mensagem" disabled={!text.trim()}>
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
              Ao encerrar, esta conversa será finalizada. Você poderá iniciar uma nova quando quiser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar conversando</AlertDialogCancel>
            <AlertDialogAction onClick={() => { toast.success("Conversa encerrada."); navigate({ to: "/app" }); }}>
              Encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function Bubble({ message, onRetry }: { message: ChatMessage; onRetry: () => void }) {
  if (message.author === "system") {
    return <p className="my-2 text-center text-xs text-muted-foreground">{message.text}</p>;
  }
  const mine = message.author === "user";
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-soft",
        mine ? "bg-primary text-primary-foreground" : "bg-card border",
      )}>
        <p className="whitespace-pre-wrap text-pretty">{message.text}</p>
        <div className={cn("mt-1 flex items-center gap-1 text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
          <span>{fmtTime(message.createdAt)}</span>
          {message.status === "sending" && <span>· enviando…</span>}
          {message.status === "error" && (
            <button onClick={onRetry} className="ml-1 underline">Falhou — reenviar</button>
          )}
        </div>
      </div>
    </div>
  );
}
