import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/layouts/PublicLayout";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como funciona — VIDA+" },
      {
        name: "description",
        content: "Entenda o passo a passo para conversar ou ser voluntário no VIDA+.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Como funciona</h1>
        <p className="mt-3 text-muted-foreground text-pretty">
          VIDA+ é uma plataforma simples e segura. Veja o passo a passo.
        </p>

        <div className="mt-10 space-y-6">
          {[
            {
              t: "1. Crie sua conta",
              d: "Crie uma conta com poucos dados. Você não precisa expor sua identidade.",
            },
            {
              t: "2. Entrar na conversa",
              d: "Clique em ‘Quero conversar’ e entre na fila. Você verá sua posição e tempo estimado.",
            },
            {
              t: "3. Voluntário disponível",
              d: "Quando um voluntário ficar livre, a conversa começa imediatamente.",
            },
            {
              t: "4. Conversa segura",
              d: "Tudo é confidencial. Você pode encerrar e denunciar a qualquer momento.",
            },
            {
              t: "5. Depois da conversa",
              d: "Sua conversa fica no histórico (sem conteúdo das mensagens). Você pode avaliar a experiência.",
            },
          ].map((s) => (
            <div key={s.t} className="rounded-2xl border bg-card p-6 shadow-soft">
              <h2 className="text-lg font-semibold">{s.t}</h2>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
