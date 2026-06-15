import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { reportService } from "@/services";
import { fmtDateTime } from "@/utils/format";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { ReportStatus } from "@/types";

export const Route = createFileRoute("/mod/$id")({
  head: () => ({ meta: [{ title: "Detalhes da denúncia — VIDA+" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const q = useQuery({ queryKey: ["report", id], queryFn: () => reportService.get(id) });
  const m = useMutation({
    mutationFn: (s: ReportStatus) => reportService.setStatus(id, s, note),
    onSuccess: () => { toast.success("Decisão registrada."); navigate({ to: "/mod" }); },
  });

  if (q.isPending) return <AppShell><p>Carregando…</p></AppShell>;
  if (!q.data) return <AppShell><p>Não encontrada.</p></AppShell>;
  const r = q.data;

  return (
    <AppShell>
      <PageHeader title={`Denúncia: ${r.reason}`} description={`Contra ${r.reportedAlias}`} actions={<StatusBadge status={r.status} />} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Detalhes</h2>
            <p className="mt-2 text-sm text-muted-foreground text-pretty">{r.details}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-muted-foreground">Reportado por</dt><dd>{r.reporterAlias}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Prioridade</dt><dd className="capitalize">{r.priority}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Aberta em</dt><dd>{fmtDateTime(r.createdAt)}</dd></div>
            </dl>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Registro de decisão</h2>
            <Textarea className="mt-3" rows={5} placeholder="Descreva sua avaliação e ação tomada" value={note} onChange={(e) => setNote(e.target.value)} />
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Ações</h2>
            <div className="mt-3 grid gap-2">
              <Confirm label="Marcar em análise" onConfirm={() => m.mutate("em_analise")} />
              <Confirm label="Resolver" variant="default" onConfirm={() => m.mutate("resolvido")} />
              <Confirm label="Arquivar" variant="outline" onConfirm={() => m.mutate("arquivado")} />
            </div>
          </section>
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Histórico</h2>
            <ol className="mt-3 space-y-3 text-sm">
              {r.history.map((h, i) => (
                <li key={i} className="grid grid-cols-[8px_1fr] items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                  <div>
                    <p>{h.action}</p>
                    <p className="text-xs text-muted-foreground">{fmtDateTime(h.at)} · {h.by}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function Confirm({ label, onConfirm, variant }: { label: string; onConfirm: () => void; variant?: "default" | "outline" | "destructive" }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild><Button variant={variant ?? "secondary"} className="w-full justify-start">{label}</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar ação?</AlertDialogTitle>
          <AlertDialogDescription>Esta ação ficará registrada no histórico do caso.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
