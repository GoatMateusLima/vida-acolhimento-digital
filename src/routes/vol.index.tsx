import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, CheckCircle2, FileText } from "lucide-react";
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
import {
  applicationService,
  metricsService,
  queueService,
  volunteerService,
  userService,
  volunteerReportService,
  chatService,
} from "@/services";
import { fmtRelative } from "@/utils/format";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { VolunteerStatus } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useVolunteerQueueRealtime } from "@/hooks/useVolunteerQueueRealtime";

export const Route = createFileRoute("/vol/")({
  head: () => ({ meta: [{ title: "Painel do voluntário — VIDA+" }] }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VolunteerStatus>("online");

  const me = useQuery({
    queryKey: ["me"],
    queryFn: userService.me,
  });

  useEffect(() => {
    if (me.data?.availabilityStatus) {
      setStatus(me.data.availabilityStatus);
    }
  }, [me.data?.availabilityStatus]);

  useAuthGuard();

  // Ativa tempo real da fila apenas quando o voluntário está online
  useVolunteerQueueRealtime(status === "online");

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
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success(`Status atualizado: ${d.status}`);
    },
  });
  const accept = useMutation({
    mutationFn: (id: string) => volunteerService.accept(id),
    onSuccess: (d) => navigate({ to: "/vol/chat/$id", params: { id: d.conversationId } }),
    onError: (err: any) => toast.error(err?.message || "Não foi possível aceitar o atendimento."),
  });

  // Relatórios de voluntário
  const [reportTitle, setReportTitle] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportConvId, setReportConvId] = useState("");
  const [reportOpen, setReportOpen] = useState(false);

  const myReports = useQuery({
    queryKey: ["my-volunteer-reports"],
    queryFn: () => volunteerReportService.getMyReports(),
  });

  const myConversations = useQuery({
    queryKey: ["my-conversations"],
    queryFn: () => chatService.getConversations(),
  });

  const submitReport = useMutation({
    mutationFn: () => {
      const selectedConv = myConversations.data?.find((c) => c.id === reportConvId);
      return volunteerReportService.submit({
        title: reportTitle,
        description: reportDesc,
        targetUserId: selectedConv?.userId || undefined,
        conversationId: reportConvId || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Relatório enviado com sucesso.");
      setReportTitle("");
      setReportDesc("");
      setReportConvId("");
      setReportOpen(false);
      qc.invalidateQueries({ queryKey: ["my-volunteer-reports"] });
    },
    onError: () => {
      toast.error("Não foi possível enviar o relatório.");
    },
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

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <FileText className="h-5 w-5" /> Relatórios operacionais
          </h2>
          <Dialog open={reportOpen} onOpenChange={setReportOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                Enviar relatório
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Novo relatório operacional</DialogTitle>
                <DialogDescription>
                  Reporte um caso de atendimento ou observação de plantão para a administração.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Assunto / Título</label>
                  <Input
                    placeholder="Ex: Dificuldade de conexão ou Acompanhamento de crise"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Vincular Atendimento (Opcional)</label>
                  <Select value={reportConvId} onValueChange={(v) => setReportConvId(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum atendimento selecionado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum atendimento</SelectItem>
                      {(myConversations.data ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.userAlias} ({new Date(c.startedAt).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Descrição Detalhada</label>
                  <Textarea
                    placeholder="Descreva detalhadamente o ocorrido..."
                    rows={4}
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => submitReport.mutate()}
                  disabled={reportTitle.trim().length < 5 || reportDesc.trim().length < 10 || submitReport.isPending}
                >
                  {submitReport.isPending ? "Enviando..." : "Enviar para Admin"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="divide-y rounded-2xl border bg-card">
          {(myReports.data ?? []).map((r) => (
            <div key={r.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">{r.title}</p>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  r.status === 'respondido' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {r.status === 'respondido' ? 'Respondido' : 'Pendente'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Enviado em {new Date(r.createdAt).toLocaleString()} 
                {r.targetUserName && ` · Usuário: ${r.targetUserName}`}
              </p>
              <p className="text-sm text-card-foreground/90 whitespace-pre-wrap">{r.description}</p>
              {r.adminFeedback && (
                <div className="mt-2 bg-muted/65 p-3 rounded-xl border border-muted-foreground/10 text-xs">
                  <p className="font-bold text-muted-foreground uppercase tracking-wider mb-1">Resposta da Administração:</p>
                  <p className="italic text-muted-foreground/90">{r.adminFeedback}</p>
                </div>
              )}
            </div>
          ))}
          {!myReports.isPending && (myReports.data?.length ?? 0) === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Você ainda não enviou nenhum relatório operacional.
            </p>
          )}
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
