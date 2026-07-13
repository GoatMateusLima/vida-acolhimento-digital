import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, UsersRound, Wifi } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { communityService } from "@/services";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export const Route = createFileRoute("/app/comunidades/")({
  head: () => ({ meta: [{ title: "Grupos de apoio — VIDA+" }] }),
  component: Page,
});

function Page() {
  useAuthGuard();
  const queryClient = useQueryClient();
  const groups = useQuery({ queryKey: ["communities"], queryFn: communityService.list });
  const join = useMutation({
    mutationFn: communityService.join,
    onSuccess: (community) => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      queryClient.setQueryData(["community", community.id], community);
      toast.success(`Você entrou como ${community.myAlias}.`);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <AppShell>
      <PageHeader
        title="Grupos de apoio"
        description="Converse com outras pessoas usando o apelido escolhido no seu cadastro."
      />

      <section className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold">Privacidade com responsabilidade</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Participantes veem apenas apelidos. Em caso de denúncia ou risco, moderadores
              autorizados podem consultar a conta real com justificativa, e o acesso fica
              registrado.
            </p>
          </div>
        </div>
      </section>

      {groups.isError && (
        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center">
          <p className="text-sm">Não foi possível carregar os grupos.</p>
          <Button className="mt-3" variant="outline" onClick={() => groups.refetch()}>
            Tentar novamente
          </Button>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {groups.isPending &&
          [1, 2, 3].map((item) => <Skeleton key={item} className="h-64 rounded-3xl" />)}
        {(groups.data ?? []).map((group) => (
          <article
            key={group.id}
            className="flex flex-col rounded-3xl border bg-card p-5 shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                {group.topic}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                {group.onlineCount} online
              </span>
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">{group.name}</h2>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{group.description}</p>
            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <UsersRound className="h-4 w-4" />
              {group.memberCount} participantes
            </div>
            {group.joined ? (
              <div className="mt-4">
                <p className="mb-2 text-xs text-muted-foreground">
                  Seu apelido: <strong className="text-foreground">{group.myAlias}</strong>
                </p>
                <Button asChild className="w-full">
                  <Link to="/app/comunidades/$id" params={{ id: group.id }}>
                    Abrir grupo
                  </Link>
                </Button>
              </div>
            ) : (
              <Button
                className="mt-4 w-full"
                variant="outline"
                disabled={join.isPending}
                onClick={() => join.mutate(group.id)}
              >
                Entrar com apelido
              </Button>
            )}
          </article>
        ))}
      </div>
    </AppShell>
  );
}
