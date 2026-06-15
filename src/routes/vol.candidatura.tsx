import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";

export const Route = createFileRoute("/vol/candidatura")({
  head: () => ({ meta: [{ title: "Minha candidatura — VIDA+" }] }),
  component: () => (
    <AppShell>
      <PageHeader
        title="Minha candidatura"
        description="Acompanhe o status da sua candidatura como voluntário."
      />
      <div className="max-w-xl rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-3">
          <StatusBadge status="aprovado" />
          <span className="text-sm">Aprovada em 12/06/2026</span>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Você está apto(a) a realizar atendimentos. Lembre-se de manter sua disponibilidade
          atualizada no painel.
        </p>
      </div>
    </AppShell>
  ),
});
