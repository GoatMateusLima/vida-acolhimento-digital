import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/common/StatusBadge";
import { moderatorApplicationService } from "@/services";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export const Route = createFileRoute("/vol/moderador")({
  head: () => ({ meta: [{ title: "Candidatura a moderador — VIDA+" }] }),
  component: Page,
});

function Page() {
  useAuthGuard();
  const [motivation, setMotivation] = useState("");
  const [experience, setExperience] = useState("");
  const mine = useQuery({
    queryKey: ["my-moderator-application"],
    queryFn: moderatorApplicationService.getMine,
    retry: false,
  });
  const submit = useMutation({
    mutationFn: () => moderatorApplicationService.submit({ motivation, experience }),
    onSuccess: () => {
      toast.success("Candidatura enviada ao administrador.");
      mine.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  return (
    <AppShell>
      <PageHeader
        title="Candidatura a moderador"
        description="Somente administradores podem aprovar esta candidatura."
      />
      {mine.data ? (
        <div className="max-w-2xl rounded-2xl border bg-card p-6">
          <StatusBadge status={mine.data.status} />
          <p className="mt-4 text-sm">
            <strong>Motivação:</strong> {mine.data.motivation}
          </p>
          <p className="mt-2 text-sm">
            <strong>Experiência:</strong> {mine.data.experience}
          </p>
        </div>
      ) : (
        <div className="max-w-2xl space-y-4">
          <Textarea
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            placeholder="Por que deseja atuar como moderador?"
            rows={5}
          />
          <Textarea
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Descreva sua experiência como voluntário."
            rows={4}
          />
          <Button
            disabled={
              motivation.trim().length < 10 || experience.trim().length < 5 || submit.isPending
            }
            onClick={() => submit.mutate()}
          >
            {submit.isPending ? "Enviando..." : "Enviar candidatura"}
          </Button>
        </div>
      )}
    </AppShell>
  );
}
