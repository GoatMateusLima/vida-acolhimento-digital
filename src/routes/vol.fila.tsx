import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock } from "lucide-react";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { queueService, volunteerService } from "@/services";
import { fmtRelative } from "@/utils/format";
import { toast } from "sonner";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useVolunteerQueueSSE } from "@/hooks/useVolunteerQueueSSE";

export const Route = createFileRoute("/vol/fila")({
  head: () => ({ meta: [{ title: "Fila completa — VIDA+" }] }),
  component: Page,
});

function Page() {
  useAuthGuard();
  const navigate = useNavigate();

  useVolunteerQueueSSE(true);

  const q = useQuery({
    queryKey: ["queue"],
    queryFn: queueService.list,
  });

  const accept = useMutation({
    mutationFn: (id: string) => volunteerService.accept(id),
    onSuccess: (d) => navigate({ to: "/vol/chat/$id", params: { id: d.conversationId } }),
    onError: (err: any) => toast.error(err?.message || "Não foi possível aceitar o atendimento."),
  });

  const list = q.data ?? [];
  const critica = list.filter((e) => e.priority === "crise");
  const prioritaria = list.filter((e) => e.priority === "prioritaria");
  const normal = list.filter((e) => e.priority === "normal");

  return (
    <AppShell>
      <PageHeader
        title="Fila completa"
        description="Pessoas aguardando atendimento agora, ordenadas por prioridade."
      />

      {q.isPending && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {!q.isPending && list.length === 0 && (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhuma pessoa aguardando agora.</p>
        </div>
      )}

      {critica.length > 0 && (
        <Group
          label="🔴 Crise — atendimento imediato"
          entries={critica}
          onAccept={(id) => accept.mutate(id)}
          loading={accept.isPending}
        />
      )}
      {prioritaria.length > 0 && (
        <Group
          label="🟡 Prioritária"
          entries={prioritaria}
          onAccept={(id) => accept.mutate(id)}
          loading={accept.isPending}
        />
      )}
      {normal.length > 0 && (
        <Group
          label="🟢 Normal"
          entries={normal}
          onAccept={(id) => accept.mutate(id)}
          loading={accept.isPending}
        />
      )}
    </AppShell>
  );
}

function Group({
  label,
  entries,
  onAccept,
  loading,
}: {
  label: string;
  entries: Awaited<ReturnType<typeof queueService.list>>;
  onAccept: (id: string) => void;
  loading: boolean;
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{label}</h2>
      <div className="divide-y rounded-2xl border bg-card">
        {entries.map((e) => (
          <div
            key={e.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium">{e.alias}</p>
                <PriorityBadge priority={e.priority} />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {e.topic} · aguardando {fmtRelative(e.waitingSince)}
                {e.estimatedWait > 0 && ` · ~${e.estimatedWait} min estimados`}
              </p>
            </div>
            <Button
              size="sm"
              className="gap-1.5 shrink-0"
              disabled={loading}
              onClick={() => onAccept(e.id)}
            >
              <CheckCircle2 className="h-4 w-4" /> Aceitar
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
