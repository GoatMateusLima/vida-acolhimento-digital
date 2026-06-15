import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { applicationService } from "@/services";
import { fmtDateTime } from "@/utils/format";
import { toast } from "sonner";
import type { ApplicationStatus } from "@/types";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/candidaturas/$id")({
  head: () => ({ meta: [{ title: "Detalhes da candidatura — VIDA+" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ["application", id], queryFn: () => applicationService.get(id) });
  const m = useMutation({
    mutationFn: (s: ApplicationStatus) => applicationService.setStatus(id, s),
    onSuccess: () => { toast.success("Decisão registrada."); navigate({ to: "/admin/candidaturas" }); },
    onError: () => toast.error("Não foi possível registrar."),
  });

  if (q.isPending) return <AppShell><p>Carregando…</p></AppShell>;
  if (!q.data) return <AppShell><p>Não encontrada.</p></AppShell>;
  const a = q.data;
  return (
    <AppShell>
      <PageHeader title={a.candidateAlias} description={`Candidatura enviada em ${fmtDateTime(a.submittedAt)}`} actions={<StatusBadge status={a.status} />} />
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Section title="Motivação">{a.motivation}</Section>
          <Section title="Disponibilidade">{a.availability}</Section>
          <Section title="Experiência">{a.experience}</Section>
        </div>
        <aside className="space-y-2 rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Ações</h2>
          <Confirm label="Aprovar" onConfirm={() => m.mutate("aprovado")} />
          <Confirm label="Marcar em análise" variant="secondary" onConfirm={() => m.mutate("em_analise")} />
          <Confirm label="Recusar" variant="destructive" onConfirm={() => m.mutate("recusado")} />
        </aside>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground text-pretty">{children}</p>
    </section>
  );
}

function Confirm({ label, onConfirm, variant }: { label: string; onConfirm: () => void; variant?: "default" | "secondary" | "destructive" }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild><Button variant={variant ?? "default"} className="w-full">{label}</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar “{label}”?</AlertDialogTitle>
          <AlertDialogDescription>O candidato será notificado por e-mail.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
