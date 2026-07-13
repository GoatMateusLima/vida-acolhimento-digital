import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { chatService } from "@/services";
import { fmtDateTime } from "@/utils/format";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export const Route = createFileRoute("/app/historico")({
  head: () => ({ meta: [{ title: "Histórico — VIDA+" }] }),
  component: Page,
});

function Page() {
  useAuthGuard();
  const q = useQuery({ queryKey: ["conversations"], queryFn: chatService.getConversations });
  const list = q.data ?? [];

  return (
    <AppShell>
      <PageHeader
        title="Histórico"
        description="Suas conversas anteriores. O conteúdo das mensagens não é armazenado."
      />
      {q.isPending ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Sem conversas ainda"
          description="Quando você conversar, ela aparecerá aqui."
        />
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {list.map((c) => (
            <li
              key={c.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.topic}</p>
                <p className="text-xs text-muted-foreground">
                  {fmtDateTime(c.startedAt)} · {c.volunteerAlias ?? "—"}
                </p>
              </div>
              <StatusBadge status={c.status} />
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
