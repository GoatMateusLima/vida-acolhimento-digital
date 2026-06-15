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
import { applicationService } from "@/services";
import { fmtRelative } from "@/utils/format";
import type { ApplicationStatus } from "@/types";

export const Route = createFileRoute("/admin/candidaturas")({
  head: () => ({ meta: [{ title: "Candidaturas — VIDA+" }] }),
  component: Page,
});

function Page() {
  const q = useQuery({ queryKey: ["applications"], queryFn: applicationService.list });
  const [s, setS] = useState("");
  const [st, setSt] = useState<ApplicationStatus | "todos">("todos");
  const list = useMemo(
    () =>
      (q.data ?? []).filter((a) => {
        if (st !== "todos" && a.status !== st) return false;
        if (s && !a.candidateAlias.toLowerCase().includes(s.toLowerCase())) return false;
        return true;
      }),
    [q.data, s, st],
  );

  return (
    <AppShell>
      <PageHeader title="Candidaturas" description="Avalie novos voluntários antes da aprovação." />
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_220px]">
        <Input placeholder="Buscar candidato…" value={s} onChange={(e) => setS(e.target.value)} />
        <Select value={st} onValueChange={(v) => setSt(v as ApplicationStatus | "todos")}>
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
        {list.map((a) => (
          <li key={a.id}>
            <Link
              to="/admin/candidaturas/$id"
              params={{ id: a.id }}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 hover:bg-muted/40"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{a.candidateAlias}</p>
                <p className="text-xs text-muted-foreground">
                  Enviada {fmtRelative(a.submittedAt)} · {a.availability}
                </p>
              </div>
              <StatusBadge status={a.status} />
            </Link>
          </li>
        ))}
        {!q.isPending && list.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma candidatura.</p>
        )}
      </ul>
    </AppShell>
  );
}
