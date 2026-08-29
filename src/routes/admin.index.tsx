import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { metricsService, volunteerReportService, reportService } from "@/services";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useState, useMemo } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { FileText, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — VIDA+" }] }),
  component: Page,
});

function Page() {
  useAuthGuard();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["metrics"], queryFn: metricsService.overview });
  const m = q.data;

  // Relatórios de voluntários
  const volunteerReports = useQuery({
    queryKey: ["admin-volunteer-reports"],
    queryFn: () => volunteerReportService.listAll(),
  });

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [adminFeedback, setAdminFeedback] = useState("");
  const [respondReportOpen, setRespondReportOpen] = useState(false);

  const respondReportMutation = useMutation({
    mutationFn: () => {
      if (!selectedReportId) throw new Error("Sem relatório selecionado");
      return volunteerReportService.respond(selectedReportId, adminFeedback);
    },
    onSuccess: () => {
      toast.success("Parecer do relatório registrado com sucesso.");
      setRespondReportOpen(false);
      setAdminFeedback("");
      setSelectedReportId(null);
      qc.invalidateQueries({ queryKey: ["admin-volunteer-reports"] });
    },
    onError: () => {
      toast.error("Não foi possível registrar o parecer.");
    },
  });

  // Reportes de moderador
  const moderatorReports = useQuery({
    queryKey: ["admin-moderator-reports"],
    queryFn: () => reportService.list(),
  });

  const [selectedModReportId, setSelectedModReportId] = useState<string | null>(null);
  const [modReportDecision, setModReportDecision] = useState("");
  const [resolveModReportOpen, setResolveModReportOpen] = useState(false);

  const resolveModReportMutation = useMutation({
    mutationFn: (status: "resolvido" | "arquivado") => {
      if (!selectedModReportId) throw new Error("Sem reporte selecionado");
      return reportService.setStatus(selectedModReportId, status, modReportDecision);
    },
    onSuccess: () => {
      toast.success("Reporte atualizado com sucesso.");
      setResolveModReportOpen(false);
      setModReportDecision("");
      setSelectedModReportId(null);
      qc.invalidateQueries({ queryKey: ["admin-moderator-reports"] });
    },
    onError: () => {
      toast.error("Não foi possível atualizar o reporte.");
    },
  });

  // Filtramos os reportes dos moderadores
  const filteredModReports = useMemo(() => {
    return (moderatorReports.data ?? []).filter((r) => r.reporterAlias !== "Sistema");
  }, [moderatorReports.data]);

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

      <div className="mt-8">
        <Tabs defaultValue="relatorios-voluntarios">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="relatorios-voluntarios" className="gap-2">
              <FileText className="h-4 w-4" /> Relatórios de Voluntários
            </TabsTrigger>
            <TabsTrigger value="reportes-moderadores" className="gap-2">
              <ShieldAlert className="h-4 w-4" /> Reportes de Moderadores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="relatorios-voluntarios" className="space-y-4">
            <div className="divide-y rounded-2xl border bg-card">
              {(volunteerReports.data ?? []).map((r) => (
                <div key={r.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{r.title}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        r.status === 'respondido' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {r.status === 'respondido' ? 'Respondido' : 'Pendente'}
                      </span>
                      {r.status === 'pendente' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedReportId(r.id);
                            setRespondReportOpen(true);
                          }}
                        >
                          Dar Parecer
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enviado por {r.volunteerName} em {new Date(r.createdAt).toLocaleString()} 
                    {r.targetUserName && ` · Usuário: ${r.targetUserName}`}
                  </p>
                  <p className="text-sm text-card-foreground/90 whitespace-pre-wrap">{r.description}</p>
                  {r.adminFeedback && (
                    <div className="mt-2 bg-muted/65 p-3 rounded-xl border border-muted-foreground/10 text-xs">
                      <p className="font-bold text-muted-foreground uppercase tracking-wider mb-1">Resposta do Admin:</p>
                      <p className="italic text-muted-foreground/90">{r.adminFeedback}</p>
                    </div>
                  )}
                </div>
              ))}
              {!volunteerReports.isPending && (volunteerReports.data?.length ?? 0) === 0 && (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum relatório de voluntário enviado.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reportes-moderadores" className="space-y-4">
            <div className="divide-y rounded-2xl border bg-card">
              {filteredModReports.map((r) => (
                <div key={r.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{r.reason}</p>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      {r.status === 'pendente' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedModReportId(r.id);
                            setResolveModReportOpen(true);
                          }}
                        >
                          Resolver
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Denunciado por {r.reporterAlias} contra {r.reportedAlias} em {new Date(r.createdAt).toLocaleString()}
                  </p>
                  {r.details && <p className="text-sm text-card-foreground/90 whitespace-pre-wrap">{r.details}</p>}
                </div>
              ))}
              {!moderatorReports.isPending && filteredModReports.length === 0 && (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum reporte de moderador enviado.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog para dar parecer no relatório de voluntário */}
      <Dialog open={respondReportOpen} onOpenChange={setRespondReportOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Parecer do Administrador</DialogTitle>
            <DialogDescription>
              Insira a resposta operacional para o voluntário sobre o relatório enviado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Parecer técnico / Resposta</label>
              <Textarea
                placeholder="Insira as observações da administração..."
                rows={4}
                value={adminFeedback}
                onChange={(e) => setAdminFeedback(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => respondReportMutation.mutate()}
              disabled={adminFeedback.trim().length < 5 || respondReportMutation.isPending}
            >
              {respondReportMutation.isPending ? "Salvando..." : "Salvar Parecer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para resolver reporte de moderador */}
      <Dialog open={resolveModReportOpen} onOpenChange={setResolveModReportOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Decidir Resolução do Reporte</DialogTitle>
            <DialogDescription>
              Escreva uma nota justificando a ação tomada para encerrar a denúncia de moderador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Nota de Resolução</label>
              <Textarea
                placeholder="Descreva a ação tomada (ex: Usuário suspenso temporariamente ou Denúncia considerada improcedente)..."
                rows={4}
                value={modReportDecision}
                onChange={(e) => setModReportDecision(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => resolveModReportMutation.mutate("arquivado")}
              disabled={modReportDecision.trim().length < 5 || resolveModReportMutation.isPending}
            >
              Arquivar (Ignorar)
            </Button>
            <Button
              onClick={() => resolveModReportMutation.mutate("resolvido")}
              disabled={modReportDecision.trim().length < 5 || resolveModReportMutation.isPending}
            >
              Marcar como Resolvido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
