import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recoverSchema } from "@/utils/validators";
import { authService } from "@/services";
import { AuthShell, Field } from "./login";

type Input = z.infer<typeof recoverSchema>;

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({ meta: [{ title: "Recuperar senha — VIDA+" }] }),
  component: Page,
});

function Page() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<Input>({
    resolver: zodResolver(recoverSchema),
    defaultValues: { email: "" },
  });
  const m = useMutation({
    mutationFn: (v: Input) => authService.recover(v.email),
    onSuccess: () => toast.success("Se a conta existir, enviaremos as instruções."),
  });

  return (
    <AuthShell>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Recuperar senha</h1>
      <p className="mt-2 text-sm text-muted-foreground">Enviaremos um link para o seu e-mail.</p>
      <form onSubmit={handleSubmit((v) => m.mutate(v))} className="mt-8 space-y-4" noValidate>
        <Field label="E-mail" id="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            {...register("email")}
          />
        </Field>
        <Button type="submit" className="h-11 w-full" disabled={m.isPending}>
          {m.isPending ? "Enviando…" : "Enviar link"}
        </Button>
        {isSubmitSuccessful && (
          <p className="text-center text-xs text-muted-foreground">
            Se a conta existir, você receberá instruções.
          </p>
        )}
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">
            Voltar para entrar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
