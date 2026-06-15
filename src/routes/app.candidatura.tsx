import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { applicationSchema, type ApplicationInput } from "@/utils/validators";
import { applicationService } from "@/services";
import { Field } from "./login";

export const Route = createFileRoute("/app/candidatura")({
  head: () => ({ meta: [{ title: "Quero ser voluntário — VIDA+" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { candidateAlias: "", motivation: "", availability: "", experience: "" },
  });
  const m = useMutation({
    mutationFn: applicationService.submit,
    onSuccess: () => {
      toast.success("Candidatura enviada! Avisaremos pelo e-mail.");
      navigate({ to: "/app" });
    },
  });

  return (
    <AppShell>
      <PageHeader
        title="Candidatura para voluntário"
        description="Conte um pouco sobre você. Sua candidatura será analisada pela equipe."
      />
      <form onSubmit={handleSubmit((v) => m.mutate(v))} className="max-w-2xl space-y-4" noValidate>
        <Field
          label="Como gostaria de ser chamado(a)?"
          id="alias"
          error={errors.candidateAlias?.message}
        >
          <Input id="alias" {...register("candidateAlias")} />
        </Field>
        <Field
          label="O que te motiva a ser voluntário?"
          id="mot"
          error={errors.motivation?.message}
        >
          <Textarea id="mot" rows={4} {...register("motivation")} />
        </Field>
        <Field label="Disponibilidade" id="av" error={errors.availability?.message}>
          <Input
            id="av"
            placeholder="Ex: noites e finais de semana"
            {...register("availability")}
          />
        </Field>
        <Field label="Experiência (opcional)" id="exp" error={errors.experience?.message}>
          <Textarea id="exp" rows={3} {...register("experience")} />
        </Field>
        <Button type="submit" disabled={m.isPending}>
          {m.isPending ? "Enviando…" : "Enviar candidatura"}
        </Button>
      </form>
    </AppShell>
  );
}
