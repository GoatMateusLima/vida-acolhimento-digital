import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userService } from "@/services";
import { profileSchema } from "@/utils/validators";
import { Field } from "./login";

type V = z.infer<typeof profileSchema>;

export const Route = createFileRoute("/app/perfil")({
  head: () => ({ meta: [{ title: "Perfil — VIDA+" }] }),
  component: Page,
});

function Page() {
  const me = useQuery({ queryKey: ["me"], queryFn: userService.me });
  const { register, handleSubmit, formState: { errors } } = useForm<V>({
    resolver: zodResolver(profileSchema),
    values: me.data ? { name: me.data.name, email: me.data.email } : undefined,
  });

  return (
    <AppShell>
      <PageHeader title="Perfil" description="Seus dados básicos." />
      <form onSubmit={handleSubmit(() => toast.success("Perfil atualizado."))} className="max-w-md space-y-4">
        <Field label="Nome" id="name" error={errors.name?.message}>
          <Input id="name" {...register("name")} />
        </Field>
        <Field label="E-mail" id="email" error={errors.email?.message}>
          <Input id="email" type="email" {...register("email")} />
        </Field>
        <Button type="submit">Salvar</Button>
      </form>
    </AppShell>
  );
}
