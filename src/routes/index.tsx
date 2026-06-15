import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Heart, MessageCircleHeart, ShieldCheck, Sparkles, Phone, Lock, UsersRound, Clock } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <PublicLayout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_50%_at_50%_0%,color-mix(in_oklab,var(--primary)_20%,transparent),transparent_70%)]"
        />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Acolhimento humano, anônimo e seguro
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
              Você não está <span className="text-primary">sozinho</span>. Tem alguém pronto para te escutar.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground text-pretty sm:text-lg">
              VIDA+ conecta você a voluntários treinados para uma conversa anônima de escuta emocional —
              sem julgamento, sem diagnóstico, no seu tempo.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/cadastro">
                <Button size="lg" className="h-12 gap-2 px-6 text-base">
                  Quero conversar <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/app/candidatura">
                <Button size="lg" variant="outline" className="h-12 gap-2 px-6 text-base">
                  <Heart className="h-4 w-4" /> Quero ser voluntário
                </Button>
              </Link>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              VIDA+ oferece <strong>acolhimento</strong>, não diagnóstico ou tratamento médico.
            </p>
          </div>
          <div className="relative min-w-0">
            <div className="rounded-3xl border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">
                  <MessageCircleHeart className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">Voluntário C.</p>
                  <p className="text-xs text-muted-foreground">online · pronto para escutar</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <Bubble who="vol">Oi! Como você está se sentindo agora?</Bubble>
                <Bubble who="me">Tenho me sentido bem ansiosa essa semana…</Bubble>
                <Bubble who="vol">Que bom que você falou. Quer me contar mais?</Bubble>
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm text-muted-foreground">
                <span className="flex-1">Escreva como está se sentindo…</span>
                <span className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">Enviar</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="border-t bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Como funciona</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">Três passos simples para uma conversa acolhedora.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { n: "1", t: "Cadastre-se", d: "Crie uma conta anônima em segundos. Nenhum dado sensível é exigido." },
              { n: "2", t: "Entre na fila", d: "Um voluntário disponível assume sua conversa com discrição." },
              { n: "3", t: "Converse à vontade", d: "Escuta atenta, livre de julgamento, no seu próprio ritmo." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border bg-background p-6 shadow-soft">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground font-display text-base font-semibold">{s.n}</div>
                <h3 className="mt-4 text-lg font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground text-pretty">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRIVACIDADE */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Feature icon={Lock} title="Anônimo por padrão" text="Você não precisa expor sua identidade. Conversas são confidenciais." />
          <Feature icon={ShieldCheck} title="Voluntários treinados" text="Selecionados e orientados para escuta ativa e respeito." />
          <Feature icon={UsersRound} title="Acolhimento humano" text="Pessoas reais, sem respostas automáticas ou roteiros prontos." />
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Perguntas frequentes</h2>
          <Accordion type="single" collapsible className="mt-6 rounded-2xl border bg-card divide-y">
            {[
              { q: "VIDA+ substitui um profissional?", a: "Não. Oferecemos acolhimento e escuta. Para diagnóstico ou tratamento, procure um profissional de saúde." },
              { q: "Meus dados ficam guardados?", a: "Apenas o mínimo necessário. Conversas e mensagens privadas não são salvas em cache do dispositivo." },
              { q: "Quanto custa?", a: "É gratuito. VIDA+ é mantido por voluntários e apoiadores." },
              { q: "Posso ser voluntário?", a: "Sim! Sua candidatura passa por uma análise da equipe." },
            ].map((f, i) => (
              <AccordionItem key={i} value={String(i)} className="border-0 px-4">
                <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* EMERGÊNCIA */}
      <section className="border-t bg-card/40">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Em situação de crise ou risco?</p>
              <p className="text-sm text-muted-foreground">Procure imediatamente: CVV 188 (24h) · SAMU 192 · Emergência 190.</p>
            </div>
          </div>
          <Link to="/seguranca">
            <Button variant="outline" size="sm">Recursos de segurança</Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}

function Bubble({ who, children }: { who: "me" | "vol"; children: React.ReactNode }) {
  return (
    <div className={who === "me" ? "flex justify-end" : "flex justify-start"}>
      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${who === "me" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
        {children}
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, text }: { icon: typeof Heart; title: string; text: string }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-soft">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary"><Icon className="h-5 w-5" /></div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground text-pretty">{text}</p>
    </div>
  );
}
