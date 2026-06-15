import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/layouts/PublicLayout";

export const Route = createFileRoute("/privacidade")({
  head: () => ({ meta: [{ title: "Política de privacidade — VIDA+" }] }),
  component: () => (
    <PublicLayout>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Política de privacidade</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última atualização: junho de 2026.</p>

        <section className="mt-8 space-y-4 text-sm text-muted-foreground text-pretty">
          <p><strong className="text-foreground">Dados coletados.</strong> Solicitamos apenas o mínimo necessário para operar o serviço (e-mail e apelido).</p>
          <p><strong className="text-foreground">Uso.</strong> Os dados são usados para autenticação, prevenção de abuso e melhorias do serviço.</p>
          <p><strong className="text-foreground">Compartilhamento.</strong> Não vendemos nem compartilhamos dados com terceiros para marketing.</p>
          <p><strong className="text-foreground">Conversas.</strong> O conteúdo de mensagens privadas não é cacheado no dispositivo nem indexado.</p>
          <p><strong className="text-foreground">Direitos (LGPD).</strong> Você pode solicitar acesso, correção e exclusão de seus dados a qualquer momento.</p>
        </section>
      </article>
    </PublicLayout>
  ),
});
