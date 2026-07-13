import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { userService } from "@/services";
import { http } from "@/services/api/client";
import { profileSchema } from "@/utils/validators";
import { Field } from "./login";
import { useAuthGuard } from "@/hooks/useAuthGuard";

type V = z.infer<typeof profileSchema>;

export const Route = createFileRoute("/app/perfil")({
  head: () => ({ meta: [{ title: "Perfil — VIDA+" }] }),
  component: Page,
});

function Page() {
  useAuthGuard();
  const me = useQuery({ queryKey: ["me"], queryFn: userService.me });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<V>({
    resolver: zodResolver(profileSchema),
    values: me.data ? { name: me.data.nickname, email: me.data.email } : undefined,
  });

  const update = useMutation({
    mutationFn: (v: V) =>
      http("/users/me/preferences", {
        method: "PATCH",
        body: JSON.stringify({ nickname: v.name }),
      }),
    onSuccess: () => toast.success("Perfil atualizado."),
    onError: () => toast.error("Não foi possível atualizar o perfil."),
  });

  return (
    <AppShell>
      <PageHeader title="Perfil" description="Seus dados básicos." />
      <form onSubmit={handleSubmit((v) => update.mutate(v))} className="max-w-md space-y-4">
        <Field label="Apelido público" id="name" error={errors.name?.message}>
          <Input id="name" {...register("name")} />
          <p className="mt-1 text-xs text-muted-foreground">
            Este apelido será exibido nos grupos. Seu nome completo permanece privado.
          </p>
        </Field>
        <Field label="E-mail" id="email" error={errors.email?.message}>
          <Input id="email" type="email" {...register("email")} disabled />
        </Field>
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Salvando…" : "Salvar"}
        </Button>
      </form>
    </AppShell>
  );
}
