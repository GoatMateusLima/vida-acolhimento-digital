import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { moderatorApplicationService } from "@/services";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export const Route = createFileRoute("/admin/moderadores/")({ component: Page });
function Page() {
  useAuthGuard();
  const query = useQuery({
    queryKey: ["moderator-applications"],
    queryFn: moderatorApplicationService.list,
  });
  return (
    <AppShell>
      <PageHeader
        title="Candidaturas a moderador"
        description="Aprovação exclusiva do administrador."
      />
      <div className="divide-y rounded-2xl border bg-card">
        {(query.data ?? []).map((item) => (
          <Link
            key={item.id}
            to="/admin/moderadores/$id"
            params={{ id: item.id }}
            className="flex items-center justify-between p-4 hover:bg-muted/40"
          >
            <div>
              <p className="font-medium">{item.candidateAlias}</p>
              <p className="text-xs text-muted-foreground">{item.motivation}</p>
            </div>
            <StatusBadge status={item.status} />
          </Link>
        ))}
        {!query.isPending && !query.data?.length && (
          <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma candidatura.</p>
        )}
      </div>
    </AppShell>
  );
}
