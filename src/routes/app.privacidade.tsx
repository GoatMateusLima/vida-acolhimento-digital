import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { http } from "@/services/api/client";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export const Route = createFileRoute("/app/privacidade")({
  head: () => ({ meta: [{ title: "Privacidade — VIDA+" }] }),
  component: Page,
});

function Page() {
  useAuthGuard();
  const [consent, setConsent] = useState({ essencial: true, melhorias: true, pesquisa: false });

  const saveConsent = useMutation({
    mutationFn: async () => {
      const entries: Array<{ type: string; version: string }> = [];
      if (consent.melhorias) entries.push({ type: "politica_privacidade", version: "1.0" });
      if (consent.pesquisa) entries.push({ type: "comunicacoes", version: "1.0" });
      entries.push({ type: "termos_de_uso", version: "1.0" });
      await Promise.all(
        entries.map((e) =>
          http("/users/me/consent", {
            method: "POST",
            body: JSON.stringify(e),
          }),
        ),
      );
    },
    onSuccess: () => toast.success("Preferências salvas."),
    onError: () => toast.error("Não foi possível salvar as preferências."),
  });

  return (
    <AppShell>
      <PageHeader
        title="Privacidade & LGPD"
        description="Você controla o uso dos seus dados. Você pode revogar consentimentos a qualquer momento."
      />
      <div className="max-w-2xl space-y-4">
        <div className="rounded-2xl border bg-card divide-y">
          <Row
            id="ess"
            label="Dados essenciais"
            desc="Necessários para autenticação e funcionamento básico."
            disabled
            checked
          />
          <Row
            id="mel"
            label="Dados de uso para melhorias"
            desc="Métricas anonimizadas para evoluir a plataforma."
            checked={consent.melhorias}
            onChange={() => setConsent((c) => ({ ...c, melhorias: !c.melhorias }))}
          />
          <Row
            id="pes"
            label="Convite para pesquisas"
            desc="Receber convites ocasionais para entrevistas."
            checked={consent.pesquisa}
            onChange={() => setConsent((c) => ({ ...c, pesquisa: !c.pesquisa }))}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => saveConsent.mutate()} disabled={saveConsent.isPending}>
            {saveConsent.isPending ? "Salvando…" : "Salvar preferências"}
          </Button>
          <Button
            variant="outline"
            onClick={() => toast("Solicitação enviada. Responderemos em até 15 dias.")}
          >
            Solicitar exclusão de dados
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function Row({
  id,
  label,
  desc,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  desc: string;
  checked: boolean;
  onChange?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-4">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
