import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { reportService, userService } from "@/services";
import { fmtRelative } from "@/utils/format";
import type { ReportStatus } from "@/types";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ShieldAlert, Users, AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/mod/")({
  head: () => ({ meta: [{ title: "Moderação — VIDA+" }] }),
  component: Page,
});

function Page() {
  useAuthGuard();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("denuncias");

  const q = useQuery({
    queryKey: ["reports"],
    queryFn: reportService.list,
    refetchInterval: 60_000,
  });

  // Consulta de usuários segura
  const usersQuery = useQuery({
    queryKey: ["safe-users"],
    queryFn: () => userService.listSafe(),
    enabled: activeTab === "usuarios",
  });
  const [userSearch, setUserSearch] = useState("");

  // Meus reportes
  const myReportsQuery = useQuery({
    queryKey: ["my-moderator-reports"],
    queryFn: () => reportService.listMine(),
    enabled: activeTab === "meus-reportes",
  });

  // Modal para reportar
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const reportUserMutation = useMutation({
    mutationFn: () => {
      if (!selectedUser) throw new Error("Nenhum usuário selecionado");
      return reportService.create({
        reportedAlias: selectedUser.id,
        reason: reportReason,
        details: reportDetails,
      });
    },
    onSuccess: () => {
      toast.success("Usuário reportado com sucesso à administração.");
      setReportModalOpen(false);
      setReportReason("");
      setReportDetails("");
      setSelectedUser(null);
      qc.invalidateQueries({ queryKey: ["my-moderator-reports"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Não foi possível enviar o reporte.");
    },
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReportStatus | "todos">("todos");

  const list = useMemo(() => {
    return (q.data ?? []).filter((r) => {
      if (status !== "todos" && r.status !== status) return false;
      if (search && !`${r.reportedAlias} ${r.reason}`.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [q.data, search, status]);

  const filteredUsers = useMemo(() => {
    return (usersQuery.data ?? []).filter((u) => {
      if (userSearch && !u.name.toLowerCase().includes(userSearch.toLowerCase())) return false;
      return true;
    });
  }, [usersQuery.data, userSearch]);

  return (
    <AppShell>
      <PageHeader
        title="Painel de Moderação"
        description="Monitore a comunidade e tome ações operacionais."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="denuncias" className="gap-2">
            <ShieldAlert className="h-4 w-4" /> Denúncias da Plataforma
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="h-4 w-4" /> Fila de Usuários
          </TabsTrigger>
          <TabsTrigger value="meus-reportes" className="gap-2">
            <FileText className="h-4 w-4" /> Meus Reportes
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Denúncias */}
        <TabsContent value="denuncias" className="space-y-4">
          <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_200px]">
            <Input
              placeholder="Buscar por apelido ou motivo…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={status} onValueChange={(v) => setStatus(v as ReportStatus | "todos")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_analise">Em análise</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
                <SelectItem value="arquivado">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ul className="divide-y rounded-2xl border bg-card">
            {list.map((r) => (
              <li key={r.id}>
                <Link
                  to="/mod/$id"
                  params={{ id: r.id }}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">{r.reason}</p>
                      <span className="text-xs text-muted-foreground">contra {r.reportedAlias}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {fmtRelative(r.createdAt)} · prioridade {r.priority}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              </li>
            ))}
            {!q.isPending && list.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Nenhuma denúncia encontrada.
              </p>
            )}
          </ul>
        </TabsContent>

        {/* TAB 2: Listagem de Usuários */}
        <TabsContent value="usuarios" className="space-y-4">
          <Input
            placeholder="Buscar usuário por nome/apelido…"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />

          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full text-sm text-left">
              <thead className="border-b text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                <tr>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Papel</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-xs capitalize text-muted-foreground">{u.role}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1"
                        onClick={() => {
                          setSelectedUser({ id: u.id, name: u.name });
                          setReportModalOpen(true);
                        }}
                      >
                        <AlertTriangle className="h-3 w-3" /> Reportar ao Admin
                      </Button>
                    </td>
                  </tr>
                ))}
                {usersQuery.isPending && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-xs text-muted-foreground">
                      Carregando usuários...
                    </td>
                  </tr>
                )}
                {!usersQuery.isPending && filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-xs text-muted-foreground">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* TAB 3: Meus Reportes Enviados */}
        <TabsContent value="meus-reportes" className="space-y-4">
          <ul className="divide-y rounded-2xl border bg-card">
            {(myReportsQuery.data ?? []).map((r) => (
              <li key={r.id} className="p-4 space-y-2 hover:bg-muted/10">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{r.reason}</p>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Reportado em {new Date(r.createdAt).toLocaleString()} · Alvo: {r.reportedAlias}
                </p>
                {r.details && <p className="text-sm text-muted-foreground">{r.details}</p>}
              </li>
            ))}
            {myReportsQuery.isPending && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Carregando seus reportes...
              </p>
            )}
            {!myReportsQuery.isPending && (myReportsQuery.data?.length ?? 0) === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Você ainda não enviou nenhum reporte à administração.
              </p>
            )}
          </ul>
        </TabsContent>
      </Tabs>

      {/* Modal de Reporte */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reportar Usuário ao Administrador</DialogTitle>
            <DialogDescription>
              Explique detalhadamente por que este usuário ({selectedUser?.name}) deve ser analisado pelo Administrador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Motivo do Reporte</label>
              <Input
                placeholder="Ex: Discurso de ódio na comunidade ou Atitude ofensiva"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Descrição / Provas</label>
              <Textarea
                placeholder="Insira detalhes adicionais sobre o comportamento do usuário..."
                rows={4}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => reportUserMutation.mutate()}
              disabled={reportReason.trim().length < 3 || reportDetails.trim().length < 5 || reportUserMutation.isPending}
            >
              {reportUserMutation.isPending ? "Enviando..." : "Enviar Reporte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
