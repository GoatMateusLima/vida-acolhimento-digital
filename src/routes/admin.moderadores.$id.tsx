import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { moderatorApplicationService } from "@/services";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export const Route = createFileRoute("/admin/moderadores/$id")({ component: Page });
function Page() {
  useAuthGuard();
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ["moderator-application", id],
    queryFn: () => moderatorApplicationService.get(id),
  });
  const decide = useMutation({
    mutationFn: (approved: boolean) => moderatorApplicationService.setStatus(id, approved),
    onSuccess: () => {
      toast.success("Decisão registrada.");
      navigate({ to: "/admin/moderadores" });
    },
    onError: (error) => toast.error(error.message),
  });
  const item = query.data;
  return (
    <AppShell>
      <PageHeader
        title={item?.candidateAlias ?? "Candidatura"}
        description="Promoção de voluntário para moderador"
      />
      {item && (
        <div className="max-w-2xl rounded-2xl border bg-card p-6">
          <p>
            <strong>Motivação:</strong> {item.motivation}
          </p>
          <p className="mt-3">
            <strong>Experiência:</strong> {item.experience}
          </p>
          {item.status === "pendente" && (
            <div className="mt-6 flex gap-3">
              <Button onClick={() => decide.mutate(true)}>Aprovar</Button>
              <Button variant="destructive" onClick={() => decide.mutate(false)}>
                Recusar
              </Button>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
