import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
import { applicationService } from "@/services";
import { fmtRelative } from "@/utils/format";
import type { ApplicationStatus } from "@/types";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export const Route = createFileRoute("/admin/candidaturas/")({
  head: () => ({ meta: [{ title: "Candidaturas — VIDA+" }] }),
  component: Page,
});

function Page() {
  useAuthGuard();
  const q = useQuery({ queryKey: ["applications"], queryFn: applicationService.list });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ApplicationStatus | "todos">("todos");
  const list = useMemo(
    () =>
      (q.data ?? []).filter((application) => {
        if (status !== "todos" && application.status !== status) return false;
        if (search && !application.candidateAlias.toLowerCase().includes(search.toLowerCase()))
          return false;
        return true;
      }),
    [q.data, search, status],
  );

  return (
    <AppShell>
      <PageHeader title="Candidaturas" description="Avalie novos voluntários antes da aprovação." />
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_220px]">
        <Input
          placeholder="Buscar candidato..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as ApplicationStatus | "todos")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="em_analise">Em análise</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="recusado">Recusado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ul className="divide-y rounded-2xl border bg-card">
        {list.map((application) => (
          <li key={application.id}>
            <Link
              to="/admin/candidaturas/$id"
              params={{ id: application.id }}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 hover:bg-muted/40"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{application.candidateAlias}</p>
                <p className="text-xs text-muted-foreground">
                  Enviada {fmtRelative(application.submittedAt)} · {application.availability}
                </p>
              </div>
              <StatusBadge status={application.status} />
            </Link>
          </li>
        ))}
        {!q.isPending && list.length === 0 && (
          <li className="p-6 text-center text-sm text-muted-foreground">Nenhuma candidatura.</li>
        )}
      </ul>
    </AppShell>
  );
}
