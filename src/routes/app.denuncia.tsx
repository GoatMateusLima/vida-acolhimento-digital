import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { reportSchema, type ReportInput } from "@/utils/validators";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reportService } from "@/services";
import { Field } from "./login";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export const Route = createFileRoute("/app/denuncia")({
  head: () => ({ meta: [{ title: "Denunciar — VIDA+" }] }),
  component: Page,
});

const REASONS = [
  "Conduta inadequada",
  "Linguagem agressiva",
  "Assédio",
  "Spam",
  "Ameaça ou violência",
  "Conteúdo inapropriado",
  "Outro",
];

function Page() {
  useAuthGuard();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReportInput>({
    resolver: zodResolver(reportSchema),
    defaultValues: { reportedAlias: "", reason: "", details: "" },
  });
  const reason = watch("reason");

  const m = useMutation({
    mutationFn: reportService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-reports"] });
      // sinaliza que acabou de enviar para a tela de acompanhamento mostrar confirmação
      sessionStorage.setItem("vida:just-reported", "1");
      toast.success("Denúncia registrada. Obrigado por nos ajudar.");
      navigate({ to: "/app/denuncias" });
    },
    onError: () => toast.error("Não foi possível registrar a denúncia. Tente novamente."),
  });

  return (
    <AppShell>
      <PageHeader
        title="Fazer uma denúncia"
        description="Sua denúncia é confidencial e será analisada pela equipe de moderação. Nenhuma ação é automática."
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link to="/app/denuncias">Ver minhas denúncias</Link>
          </Button>
        }
      />
      <form onSubmit={handleSubmit((v) => m.mutate(v))} className="max-w-2xl space-y-5" noValidate>
        <Field label="Quem você está denunciando?" id="alias" error={errors.reportedAlias?.message}>
          <Input
            id="alias"
            placeholder="Apelido exibido na conversa ou no grupo"
            {...register("reportedAlias")}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Use o apelido exibido durante a conversa ou mensagem. Não precisa ser o nome real.
          </p>
        </Field>

        <Field label="Motivo da denúncia" id="reason" error={errors.reason?.message}>
          <Select
            value={reason}
            onValueChange={(v) => setValue("reason", v, { shouldValidate: true })}
          >
            <SelectTrigger id="reason">
              <SelectValue placeholder="Selecione o motivo" />
            </SelectTrigger>
            <SelectContent>
              {REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Descreva o ocorrido" id="details" error={errors.details?.message}>
          <Textarea
            id="details"
            rows={5}
            placeholder="Descreva o que aconteceu com o máximo de detalhes que se sentir confortável em compartilhar."
            {...register("details")}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Mínimo de 10 caracteres. Máximo de 1000.
          </p>
        </Field>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={m.isPending}>
            {m.isPending ? "Enviando…" : "Enviar denúncia"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate({ to: "/app" })}>
            Cancelar
          </Button>
        </div>

        <p className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground">
          Sua identidade não será revelada ao denunciado. A moderação tem acesso apenas ao
          necessário para a investigação.
        </p>
      </form>
    </AppShell>
  );
}
