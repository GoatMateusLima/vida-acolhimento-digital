import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";

export const Route = createFileRoute("/app/preferencias")({
  head: () => ({ meta: [{ title: "Preferências — VIDA+" }] }),
  component: Page,
});

function Page() {
  const { theme, toggle } = useTheme();
  const [notif, setNotif] = useState(true);
  const [reduce, setReduce] = useState(false);

  return (
    <AppShell>
      <PageHeader title="Preferências" description="Personalize a sua experiência." />
      <div className="max-w-xl divide-y rounded-2xl border bg-card">
        <Row
          id="theme"
          label="Modo escuro"
          desc="Aparência mais suave para ambientes com pouca luz."
          checked={theme === "dark"}
          onChange={toggle}
        />
        <Row
          id="notif"
          label="Notificações"
          desc="Receba alertas quando um voluntário ficar disponível."
          checked={notif}
          onChange={() => setNotif(!notif)}
        />
        <Row
          id="reduce"
          label="Reduzir animações"
          desc="Diminui efeitos de movimento na interface."
          checked={reduce}
          onChange={() => setReduce(!reduce)}
        />
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
}: {
  id: string;
  label: string;
  desc: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-4">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
