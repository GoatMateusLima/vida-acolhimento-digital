import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { chatService } from "@/services";
import { StatusBadge } from "@/components/common/StatusBadge";
import { fmtDateTime } from "@/utils/format";

export const Route = createFileRoute("/vol/historico")({
  head: () => ({ meta: [{ title: "Histórico de atendimentos — VIDA+" }] }),
  component: Page,
});

function Page() {
  const q = useQuery({ queryKey: ["conversations"], queryFn: chatService.getConversations });
  return (
    <AppShell>
      <PageHeader title="Histórico de atendimentos" />
      <ul className="divide-y overflow-hidden rounded-2xl border bg-card shadow-soft">
        {(q.data ?? []).map((c) => (
          <li
            key={c.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 transition hover:bg-muted/35"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {c.topic} · {c.userAlias}
              </p>
              <p className="text-xs text-muted-foreground">{fmtDateTime(c.startedAt)}</p>
            </div>
            <StatusBadge status={c.status} />
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
