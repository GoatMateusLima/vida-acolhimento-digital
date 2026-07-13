import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { signupSchema, type SignupInput } from "@/utils/validators";
import { authService } from "@/services";
import { useProfile } from "@/contexts/ProfileContext";
import { AuthShell, Field } from "./login";
import { roleHome } from "@/hooks/useAuthGuard";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Criar conta — VIDA+" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const { setAuthenticated, setRole, setCurrentUser } = useProfile();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      nickname: "",
      email: "",
      password: "",
      accept: false as unknown as true,
    },
  });
  const accept = watch("accept");

  const m = useMutation({
    mutationFn: (v: SignupInput) => authService.signup(v),
    onSuccess: (user) => {
      setRole(user.role);
      setAuthenticated(true);
      setCurrentUser(user);
      toast.success("Conta criada com sucesso!");
      navigate({ to: roleHome(user.role) });
    },
    onError: () => toast.error("Não foi possível criar sua conta. Tente novamente."),
  });

  return (
    <AuthShell>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Criar conta</h1>
      <p className="mt-2 text-sm text-muted-foreground">Leva menos de um minuto.</p>

      <form onSubmit={handleSubmit((v) => m.mutate(v))} className="mt-8 space-y-4" noValidate>
        <Field label="Nome completo" id="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" {...register("name")} />
          <p className="mt-1 text-xs text-muted-foreground">
            Dado privado, acessível somente à equipe autorizada.
          </p>
        </Field>
        <Field label="Apelido público" id="nickname" error={errors.nickname?.message}>
          <Input id="nickname" autoComplete="nickname" {...register("nickname")} />
          <p className="mt-1 text-xs text-muted-foreground">
            É este nome que as outras pessoas verão nos grupos.
          </p>
        </Field>
        <Field label="E-mail" id="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            {...register("email")}
          />
        </Field>
        <Field label="Senha" id="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
        </Field>
        <label className="flex items-start gap-3 text-sm">
          <Checkbox
            checked={accept}
            onCheckedChange={(v) =>
              setValue("accept", !!v as unknown as true, { shouldValidate: true })
            }
            id="accept"
          />
          <span>
            Li e aceito os{" "}
            <Link to="/termos" className="text-primary hover:underline">
              termos
            </Link>{" "}
            e a{" "}
            <Link to="/privacidade" className="text-primary hover:underline">
              política de privacidade
            </Link>
            .
          </span>
        </label>
        {errors.accept && (
          <p role="alert" className="text-xs text-destructive">
            {errors.accept.message}
          </p>
        )}
        <Button type="submit" className="h-11 w-full" disabled={m.isPending}>
          {m.isPending ? "Criando…" : "Criar conta"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
