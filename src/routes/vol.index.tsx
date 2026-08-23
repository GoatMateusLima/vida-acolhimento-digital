import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applicationService, metricsService, queueService, volunteerService } from "@/services";
import { fmtRelative } from "@/utils/format";
import { useState } from "react";
import { toast } from "sonner";
import type { VolunteerStatus } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useVolunteerQueueSSE } from "@/hooks/useVolunteerQueueSSE";

export const Route = createFileRoute("/vol/")({
  head: () => ({ meta: [{ title: "Painel do voluntário — VIDA+" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<VolunteerStatus>("online");

  useAuthGuard();

  // Ativa SSE da fila em tempo real apenas quando o voluntário está online
  useVolunteerQueueSSE(status === "online");

  const q = useQuery({ queryKey: ["queue"], queryFn: queueService.list });
  const dashboard = useQuery({
    queryKey: ["volunteer-dashboard"],
    queryFn: metricsService.overview,
  });

  const myApplication = useQuery({
    queryKey: ["my-application"],
    queryFn: applicationService.getMine,
  });

  const setStatusM = useMutation({
    mutationFn: (s: VolunteerStatus) => volunteerService.setStatus("me", s),
    onSuccess: (d) => {
      setStatus(d.status);
      toast.success(`Status atualizado: ${d.status}`);
    },
  });
  const accept = useMutation({
    mutationFn: (id: string) => volunteerService.accept(id),
    onSuccess: (d) => navigate({ to: "/vol/chat/$id", params: { id: d.conversationId } }),
  });

  return (
    <AppShell>
      <PageHeader
        title="Painel do voluntário"
        description="Acompanhe quem precisa de escuta agora."
        actions={
          <Select value={status} onValueChange={(v) => setStatusM.mutate(v as VolunteerStatus)}>
            <SelectTrigger className="w-[150px]" aria-label="Status de disponibilidade">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">🟢 Online</SelectItem>
              <SelectItem value="ocupado">🟡 Ocupado</SelectItem>
              <SelectItem value="offline">⚪ Offline</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Conversas ativas"
          value={dashboard.data ? String(dashboard.data.activeConversations) : "—"}
        />
        <Stat label="Na fila agora" value={q.data ? String(q.data.length) : "—"} />
        <Stat
          label="Voluntários online"
          value={dashboard.data ? String(dashboard.data.totalVolunteers) : "—"}
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold">
          <Users className="h-5 w-5" /> Fila de espera
        </h2>
        <div className="divide-y rounded-2xl border bg-card">
          {q.isPending && (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          )}
          {(q.data ?? []).map((e) => (
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
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => accept.mutate(e.id)}
                disabled={accept.isPending || status !== "online"}
                className="gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" /> Aceitar
              </Button>
            </div>
          ))}
          {!q.isPending && (q.data?.length ?? 0) === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma pessoa aguardando agora.
            </p>
          )}
          {status !== "online" && !q.isPending && (
            <p className="border-t p-4 text-center text-xs text-muted-foreground">
              Fique online para aceitar um novo atendimento.
            </p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl font-semibold">Status da sua candidatura</h2>
        <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
          <StatusBadge status={myApplication.data?.status ?? "pendente"} />
          <p className="text-sm text-muted-foreground">
            {myApplication.data?.status === "aprovado"
              ? "Você está apto a atender."
              : myApplication.data?.status === "pendente"
                ? "Candidatura em análise."
                : myApplication.data?.status === "recusado"
                  ? "Candidatura não aprovada."
                  : "Carregando…"}
          </p>
          <Link to="/vol/candidatura" className="ml-auto text-sm text-primary hover:underline">
            Ver detalhes
          </Link>
        </div>
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}
