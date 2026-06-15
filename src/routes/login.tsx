import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/utils/validators";
import { authService } from "@/services";
import { useProfile } from "@/contexts/ProfileContext";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — VIDA+" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const { setAuthenticated } = useProfile();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const m = useMutation({
    mutationFn: ({ email, password }: LoginInput) => authService.login(email, password),
    onSuccess: () => {
      setAuthenticated(true);
      toast.success("Bem-vindo(a) de volta!");
      navigate({ to: "/app" });
    },
    onError: () => toast.error("Não foi possível entrar. Tente novamente."),
  });

  return (
    <AuthShell>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Entrar</h1>
      <p className="mt-2 text-sm text-muted-foreground">Bem-vindo(a) de volta ao VIDA+.</p>

      <form onSubmit={handleSubmit((v) => m.mutate(v))} className="mt-8 space-y-4" noValidate>
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
            autoComplete="current-password"
            {...register("password")}
          />
        </Field>
        <Button type="submit" className="h-11 w-full" disabled={m.isPending}>
          {m.isPending ? "Entrando…" : "Entrar"}
        </Button>
        <div className="flex justify-between text-sm">
          <Link to="/recuperar-senha" className="text-primary hover:underline">
            Esqueci minha senha
          </Link>
          <Link to="/cadastro" className="text-muted-foreground hover:text-foreground">
            Criar conta
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-gradient-to-b from-background to-secondary/30 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 inline-block">
          <Logo />
        </Link>
        <div className="rounded-3xl border bg-card p-8 shadow-soft">{children}</div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Em emergência: CVV <strong>188</strong> · SAMU <strong>192</strong>
        </p>
      </div>
    </div>
  );
}

export function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
