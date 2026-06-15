import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/layouts/PublicLayout";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — VIDA+" },
      { name: "description", content: "Conheça a missão e os valores do VIDA+." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Sobre o VIDA+</h1>
        <div className="mt-6 space-y-5 text-muted-foreground text-pretty">
          <p>
            VIDA+ nasceu da convicção de que escutar com cuidado pode mudar o dia (e a vida) de
            alguém.
          </p>
          <p>
            Conectamos pessoas que precisam de acolhimento a voluntários treinados em escuta ativa —
            com respeito, anonimato e empatia.
          </p>
          <p>
            Não somos um serviço de saúde. Para diagnóstico, tratamento ou medicação, procure um
            profissional habilitado.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { t: "Empatia", d: "Pessoas no centro." },
            { t: "Anonimato", d: "Privacidade por padrão." },
            { t: "Cuidado", d: "Voluntários orientados." },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border bg-card p-5 shadow-soft">
              <h3 className="font-display text-lg font-semibold">{c.t}</h3>
              <p className="text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
