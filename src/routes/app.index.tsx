import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircleHeart, History, Heart, Sparkles, UsersRound } from "lucide-react";
import { AppShell } from "@/layouts/AppShell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { chatService, userService } from "@/services";
import { fmtDate, fmtRelative } from "@/utils/format";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Início — VIDA+" }] }),
  component: Page,
});

function Page() {
  useAuthGuard();
  const me = useQuery({ queryKey: ["me"], queryFn: userService.me });
  const conv = useQuery({ queryKey: ["conversations"], queryFn: chatService.getConversations });

  return (
    <AppShell>
      <PageHeader
        title={me.isPending ? "Olá!" : `Olá, ${me.data?.name.split(" ")[0] ?? "por aqui"}!`}
        description="Como você está se sentindo hoje? Se quiser conversar, estamos aqui."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/app/conversar"
          className="group relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-soft transition hover:opacity-95"
        >
          <Sparkles className="absolute -right-4 -top-4 h-24 w-24 opacity-15" />
          <MessageCircleHeart className="h-7 w-7" aria-hidden="true" />
          <h2 className="mt-4 font-display text-2xl font-semibold">Conversar agora</h2>
          <p className="mt-1 text-sm opacity-90">Encontre um voluntário disponível.</p>
          <span className="mt-4 inline-block text-sm font-medium underline-offset-4 group-hover:underline">
            Entrar na fila →
          </span>
        </Link>

        <Link
          to="/app/comunidades"
          className="group rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-soft transition hover:bg-primary/10"
        >
          <UsersRound className="h-7 w-7 text-primary" />
          <h2 className="mt-4 font-display text-2xl font-semibold">Grupos de apoio</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Converse em comunidade usando um apelido anônimo.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 group-hover:underline">
            Ver grupos →
          </span>
        </Link>

        <Link
          to="/app/historico"
          className="group rounded-3xl border bg-card p-6 shadow-soft transition hover:bg-muted/30"
        >
          <History className="h-7 w-7 text-primary" />
          <h2 className="mt-4 font-display text-2xl font-semibold">Suas conversas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Veja seu histórico de atendimentos.</p>
          <span className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 group-hover:underline">
            Ver histórico →
          </span>
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Atividade recente</h2>
        <div className="mt-3 divide-y rounded-2xl border bg-card">
          {conv.isPending && (
            <div className="space-y-3 p-4" aria-label="Carregando atividade recente">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          )}
          {(conv.data ?? []).slice(0, 4).map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.topic}</p>
                <p className="text-xs text-muted-foreground">
                  {fmtDate(c.startedAt)} · {fmtRelative(c.startedAt)}
                </p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
          {!conv.isPending && (conv.data?.length ?? 0) === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">Sem conversas ainda.</p>
          )}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border bg-secondary/40 p-6">
        <div className="flex items-start gap-3">
          <Heart className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">Quer ajudar quem precisa?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Torne-se voluntário e ofereça escuta a outras pessoas.
            </p>
            <Link to="/app/candidatura" className="mt-3 inline-block">
              <Button variant="outline" size="sm">
                Quero ser voluntário
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
