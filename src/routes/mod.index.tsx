import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reportService } from "@/services";
import { fmtRelative } from "@/utils/format";
import type { ReportStatus } from "@/types";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export const Route = createFileRoute("/mod/")({
  head: () => ({ meta: [{ title: "Moderação — VIDA+" }] }),
  component: Page,
});

function Page() {
  useAuthGuard();
  const q = useQuery({
    queryKey: ["reports"],
    queryFn: reportService.list,
    refetchInterval: 60_000,
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

  return (
    <AppShell>
      <PageHeader
        title="Denúncias"
        description="Avalie cada caso com cuidado. Nenhuma punição é aplicada automaticamente."
      />

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
    </AppShell>
  );
}
