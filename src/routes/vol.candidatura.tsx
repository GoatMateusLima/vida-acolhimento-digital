import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { applicationService, moderatorApplicationService } from "@/services";
import { fmtDateTime } from "@/utils/format";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export const Route = createFileRoute("/vol/candidatura")({
  head: () => ({ meta: [{ title: "Minha candidatura — VIDA+" }] }),
  component: Page,
});

function Page() {
  useAuthGuard();
  const [motivation, setMotivation] = useState("");
  const [experience, setExperience] = useState("");

  // A rota /me garante que nenhum usuário receba a candidatura de outra pessoa.
  const q = useQuery({ queryKey: ["my-application"], queryFn: applicationService.getMine });
  const application = q.data;
  const moderatorApplication = useQuery({
    queryKey: ["my-moderator-application"],
    queryFn: moderatorApplicationService.getMine,
    retry: false,
  });
  const submitModerator = useMutation({
    mutationFn: () => moderatorApplicationService.submit({ motivation, experience }),
    onSuccess: () => {
      toast.success("Candidatura para moderador enviada ao administrador.");
      moderatorApplication.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <AppShell>
      <PageHeader
        title="Minha candidatura"
        description="Acompanhe o status da sua candidatura como voluntário."
      />
      <div className="max-w-2xl rounded-2xl border bg-card p-6">
        {q.isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-32 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
          </div>
        ) : !application ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma candidatura encontrada. Se você se candidatou recentemente, aguarde alguns
            instantes.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <StatusBadge status={application.status} />
              <span className="text-sm text-muted-foreground">
                Enviada em {fmtDateTime(application.submittedAt)}
              </span>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="font-medium">Motivação</dt>
                <dd className="mt-1 text-muted-foreground text-pretty">{application.motivation}</dd>
              </div>
              {application.availability && (
                <div>
                  <dt className="font-medium">Disponibilidade</dt>
                  <dd className="mt-1 text-muted-foreground">{application.availability}</dd>
                </div>
              )}
              {application.experience && (
                <div>
                  <dt className="font-medium">Experiência</dt>
                  <dd className="mt-1 text-muted-foreground text-pretty">
                    {application.experience}
                  </dd>
                </div>
              )}
            </dl>
            {application.status === "aprovado" && (
              <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                Você está apto(a) a realizar atendimentos. Mantenha sua disponibilidade atualizada
                no painel.
              </p>
            )}
            {application.status === "pendente" && (
              <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                Sua candidatura está em análise. Você será notificado(a) por e-mail.
              </p>
            )}
            {application.status === "recusado" && (
              <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
                Sua candidatura não foi aprovada neste momento. Você poderá se candidatar novamente
                no futuro.
              </p>
            )}
          </>
        )}
      </div>
      <section className="mt-6 max-w-2xl rounded-2xl border bg-card p-6">
        <h2 className="font-display text-xl font-semibold">Candidatura para moderador</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Voluntários podem solicitar esta função. Somente administradores podem aprovar.
        </p>
        {moderatorApplication.isPending ? (
          <div className="mt-5 space-y-3">
            <Skeleton className="h-6 w-28 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
          </div>
        ) : moderatorApplication.data ? (
          <div className="mt-5">
            <div className="flex items-center gap-3">
              <StatusBadge status={moderatorApplication.data.status} />
              <span className="text-sm text-muted-foreground">
                Enviada em {fmtDateTime(moderatorApplication.data.submittedAt)}
              </span>
            </div>
            <p className="mt-4 text-sm">
              <strong>Motivação:</strong> {moderatorApplication.data.motivation}
            </p>
            {moderatorApplication.data.experience && (
              <p className="mt-2 text-sm">
                <strong>Experiência:</strong> {moderatorApplication.data.experience}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <Textarea
              value={motivation}
              onChange={(event) => setMotivation(event.target.value)}
              placeholder="Por que deseja atuar como moderador?"
              rows={5}
            />
            <Textarea
              value={experience}
              onChange={(event) => setExperience(event.target.value)}
              placeholder="Descreva sua experiência como voluntário."
              rows={4}
            />
            <Button
              disabled={
                motivation.trim().length < 10 ||
                experience.trim().length < 5 ||
                submitModerator.isPending
              }
              onClick={() => submitModerator.mutate()}
            >
              {submitModerator.isPending ? "Enviando..." : "Enviar candidatura"}
            </Button>
          </div>
        )}
      </section>
    </AppShell>
  );
}
