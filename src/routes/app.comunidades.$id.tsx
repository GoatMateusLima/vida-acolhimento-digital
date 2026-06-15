import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Flag, LogOut, Send, ShieldCheck, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/layouts/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { communityService } from "@/services";
import { fmtRelative } from "@/utils/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/comunidades/$id")({
  head: () => ({ meta: [{ title: "Grupo de apoio — VIDA+" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const group = useQuery({ queryKey: ["community", id], queryFn: () => communityService.get(id) });
  const messages = useQuery({
    queryKey: ["community-messages", id],
    queryFn: () => communityService.getMessages(id),
  });
  const send = useMutation({
    mutationFn: (message: string) => communityService.sendMessage(id, message),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["community-messages", id] });
    },
    onError: (error) => toast.error(error.message),
  });
  const leave = useMutation({
    mutationFn: () => communityService.leave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      toast("Você saiu do grupo.");
      navigate({ to: "/app/comunidades" });
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const message = text.trim();
    if (message) send.mutate(message);
  };

  if (group.isPending)
    return (
      <AppShell>
        <p>Carregando...</p>
      </AppShell>
    );
  if (!group.data)
    return (
      <AppShell>
        <p>Grupo não encontrado.</p>
      </AppShell>
    );

  return (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="overflow-hidden rounded-3xl border bg-card shadow-soft">
          <header className="border-b bg-secondary/30 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link
                  to="/app/comunidades"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  ← Todos os grupos
                </Link>
                <h1 className="mt-2 font-display text-2xl font-semibold">{group.data.name}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UsersRound className="h-3.5 w-3.5" />
                  {group.data.memberCount} participantes · você é {group.data.myAlias}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => leave.mutate()}
                aria-label="Sair do grupo"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>

          <div className="h-[48vh] min-h-80 space-y-4 overflow-y-auto p-4 sm:p-5">
            {(messages.data ?? []).map((message) => (
              <article
                key={message.id}
                className={cn("max-w-[88%]", message.isMine ? "ml-auto text-right" : "mr-auto")}
              >
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  {!message.isMine && <strong className="text-foreground">{message.alias}</strong>}
                  <span className={message.isMine ? "ml-auto" : ""}>
                    {fmtRelative(message.createdAt)}
                  </span>
                </div>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-left text-sm",
                    message.isMine
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-muted",
                  )}
                >
                  {message.text}
                </div>
                {!message.isMine && (
                  <Link
                    to="/app/denuncia"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Flag className="h-3 w-3" /> Denunciar
                  </Link>
                )}
              </article>
            ))}
            {!messages.isPending && (messages.data?.length ?? 0) === 0 && (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Ainda não há mensagens. Você pode começar com um oi.
              </p>
            )}
          </div>

          <form onSubmit={submit} className="border-t p-3 sm:p-4">
            <div className="flex items-end gap-2">
              <Textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={`Escreva como ${group.data.myAlias}...`}
                rows={2}
                maxLength={2000}
                disabled={!group.data.joined}
              />
              <Button type="submit" size="icon" disabled={!text.trim() || send.isPending}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Enviar</span>
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Não compartilhe nome, telefone, endereço ou redes sociais.
            </p>
          </form>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="mt-2 text-sm font-semibold">Como sua identidade é protegida</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              O grupo vê somente seu apelido. Moderadores não consultam identidades livremente: isso
              ocorre apenas em denúncia ou risco, com justificativa e registro de auditoria.
            </p>
          </section>
          <section className="rounded-2xl border bg-card p-4">
            <h2 className="text-sm font-semibold">Combinados do grupo</h2>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {group.data.rules.map((rule) => (
                <li key={rule} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
