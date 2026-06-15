import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/vol/chat/$id")({
  head: () => ({ meta: [{ title: "Atendimento — VIDA+" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [actionTaken, setActionTaken] = useState("");
  const [ended, setEnded] = useState(false);

  return (
    <AppShell>
      <PageHeader title={`Atendimento #${id}`} description="Conversa ativa. Mantenha tom acolhedor, sem julgamentos." />
      {!ended ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border bg-card p-6 min-h-[300px]">
            <p className="text-sm text-muted-foreground">[Demo] Use a mesma interface de chat do usuário para o atendimento real.</p>
          </div>
          <aside className="rounded-2xl border bg-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-warning" /> Sinalizar risco</h3>
            <p className="mt-1 text-xs text-muted-foreground">Use apenas em situações de risco potencial. Acionará a moderação.</p>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => toast.warning("Risco sinalizado. Equipe notificada.")}>Sinalizar</Button>
            <div className="mt-6 border-t pt-4">
              <Button variant="destructive" size="sm" className="w-full" onClick={() => setEnded(true)}>Encerrar atendimento</Button>
            </div>
          </aside>
        </div>
      ) : (
        <div className="max-w-2xl rounded-2xl border bg-card p-6">
          <h3 className="font-semibold">Registro do atendimento</h3>
          <p className="mt-1 text-sm text-muted-foreground">Descreva brevemente a ação tomada (sem dados sensíveis).</p>
          <Textarea rows={5} className="mt-3" value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} />
          <div className="mt-4 flex gap-2">
            <Button onClick={() => { toast.success("Atendimento registrado."); navigate({ to: "/vol" }); }}>Salvar e finalizar</Button>
            <Button variant="ghost" onClick={() => navigate({ to: "/vol" })}>Pular</Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
