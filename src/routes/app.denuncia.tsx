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
import { reportSchema, type ReportInput } from "@/utils/validators";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { reportService } from "@/services";
import { Field } from "./login";

export const Route = createFileRoute("/app/denuncia")({
  head: () => ({ meta: [{ title: "Denunciar — VIDA+" }] }),
  component: Page,
});

const REASONS = ["Conduta inadequada", "Linguagem agressiva", "Assédio", "Spam", "Outro"];

function Page() {
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ReportInput>({
    resolver: zodResolver(reportSchema),
    defaultValues: { reportedAlias: "", reason: "", details: "" },
  });
  const reason = watch("reason");
  const m = useMutation({
    mutationFn: reportService.create,
    onSuccess: () => { toast.success("Denúncia registrada. Obrigado por nos ajudar."); navigate({ to: "/app" }); },
  });

  return (
    <AppShell>
      <PageHeader title="Denunciar" description="Sua denúncia será analisada pela equipe de moderação. Nenhuma ação é automática." />
      <form onSubmit={handleSubmit((v) => m.mutate(v))} className="max-w-2xl space-y-4" noValidate>
        <Field label="Quem você está denunciando?" id="alias" error={errors.reportedAlias?.message}>
          <Input id="alias" placeholder="Apelido da conversa" {...register("reportedAlias")} />
        </Field>
        <Field label="Motivo" id="reason" error={errors.reason?.message}>
          <Select value={reason} onValueChange={(v) => setValue("reason", v, { shouldValidate: true })}>
            <SelectTrigger id="reason"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Detalhes" id="details" error={errors.details?.message}>
          <Textarea id="details" rows={5} {...register("details")} />
        </Field>
        <Button type="submit" disabled={m.isPending}>{m.isPending ? "Enviando…" : "Enviar denúncia"}</Button>
      </form>
    </AppShell>
  );
}
