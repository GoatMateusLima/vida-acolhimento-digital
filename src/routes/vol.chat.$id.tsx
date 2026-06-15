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

export const Route = createFileRoute("/vol/chat/$id")({
  head: () => ({ meta: [{ title: "Atendimento — VIDA+" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [riskLevel, setRiskLevel] = useState("baixo");
  const [riskReason, setRiskReason] = useState("");
  const [ended, setEnded] = useState(false);
  const messages = useQuery({
    queryKey: ["messages", id],
    queryFn: () => chatService.getMessages(id),
  });
  const send = useMutation({
    mutationFn: (value: string) => chatService.sendMessage(id, value, "volunteer"),
    onSuccess: (message) => {
      qc.setQueryData<ChatMessage[]>(["messages", id], (current) => [...(current ?? []), message]);
      setText("");
    },
    onError: () => toast.error("Não foi possível enviar a mensagem."),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.data?.length]);

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
              <div className="mx-auto flex max-w-2xl items-end gap-2">
                <label htmlFor="volunteer-message" className="sr-only">
                  Mensagem
                </label>
                <Textarea
                  id="volunteer-message"
                  rows={1}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
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
              disabled={riskReason.trim().length < 5}
              onClick={() => {
                toast.warning(`Risco ${riskLevel} registrado. Equipe notificada.`);
                setRiskReason("");
              }}
            >
              Registrar sinalização
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
  const mine = message.author === "volunteer";
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
