import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/vol/fila")({
  head: () => ({ meta: [{ title: "Fila — VIDA+" }] }),
  component: () => (
    <AppShell>
      <PageHeader title="Fila completa" description="Lista detalhada de pessoas aguardando." />
      <p className="text-sm text-muted-foreground">Veja o painel para aceitar atendimentos. (Demo)</p>
    </AppShell>
  ),
});
