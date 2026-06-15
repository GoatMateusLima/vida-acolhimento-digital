import { createFileRoute } from "@tanstack/react-router";
import { Phone, Shield, Lock, AlertTriangle } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";

export const Route = createFileRoute("/seguranca")({
  head: () => ({ meta: [{ title: "Segurança e privacidade — VIDA+" }, { name: "description", content: "Como cuidamos da sua privacidade e o que fazer em situações de crise." }] }),
  component: Page,
});

function Page() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Segurança e privacidade</h1>
        <p className="mt-3 text-muted-foreground">Princípios e práticas que orientam o VIDA+.</p>

        <div className="mt-8 grid gap-4">
          <Item icon={Lock} title="Anonimato">Você não precisa informar nome real, telefone ou endereço.</Item>
          <Item icon={Shield} title="Voluntários orientados">Passam por seleção e recebem diretrizes claras de escuta e conduta.</Item>
          <Item icon={AlertTriangle} title="Denúncia simples">Qualquer comportamento inadequado pode ser reportado em poucos cliques.</Item>
        </div>

        <div className="mt-10 rounded-2xl border bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-5 w-5 text-destructive" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold">Em emergência</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Se você ou alguém estiver em risco imediato, procure ajuda profissional:
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                <li><strong>CVV 188</strong> — atendimento gratuito 24h</li>
                <li><strong>SAMU 192</strong> — emergência médica</li>
                <li><strong>190</strong> — emergência policial</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

function Item({ icon: Icon, title, children }: { icon: typeof Phone; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border bg-card p-5 shadow-soft">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground text-pretty">{children}</p>
      </div>
    </div>
  );
}
