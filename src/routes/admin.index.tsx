import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { metricsService } from "@/services";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — VIDA+" }] }),
  component: Page,
});

function Page() {
  const q = useQuery({ queryKey: ["metrics"], queryFn: metricsService.overview });
  const m = q.data;

  return (
    <AppShell>
      <PageHeader title="Dashboard" description="Visão geral da plataforma." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Usuários" value={m?.totalUsers.toLocaleString("pt-BR") ?? "—"} />
        <Stat label="Voluntários" value={m?.totalVolunteers.toString() ?? "—"} />
        <Stat label="Conversas hoje" value={m?.conversationsToday.toString() ?? "—"} />
        <Stat label="Satisfação" value={m ? `${m.satisfactionRate}%` : "—"} />
      </div>

      <section className="mt-8 rounded-2xl border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">Conversas na semana</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={m?.weekly ?? []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                }}
                labelStyle={{ color: "var(--foreground)" }}
              />
              <Bar dataKey="conversations" radius={[8, 8, 0, 0]} fill="var(--primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Stat label="Conversas ativas" value={m?.activeConversations.toString() ?? "—"} />
        <Stat label="Tempo médio de espera" value={m ? `${m.avgWaitMinutes} min` : "—"} />
      </div>
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
