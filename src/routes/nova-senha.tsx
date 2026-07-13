import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, setAccessToken } from "@/services/api/client";
import { AuthShell, Field } from "./login";

const schema = z
  .object({
    password: z
      .string()
      .min(10, "Mínimo de 10 caracteres")
      .regex(/[a-z]/, "Inclua uma letra minúscula")
      .regex(/[A-Z]/, "Inclua uma letra maiúscula")
      .regex(/[0-9]/, "Inclua um número"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "As senhas não coincidem",
  });

type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/nova-senha")({
  head: () => ({ meta: [{ title: "Nova senha — VIDA+" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [tokenError, setTokenError] = useState(false);

  // Supabase redireciona com access_token no hash da URL (#access_token=...)
  // O backend pode usar query param (?token=...) — tratamos os dois
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", ""));
    const tokenFromHash = params.get("access_token");
    const tokenFromQuery = new URLSearchParams(window.location.search).get("token");
    const token = tokenFromHash ?? tokenFromQuery;
    if (token) {
      setAccessToken(token);
    } else {
      setTokenError(true);
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  const m = useMutation({
    mutationFn: async (v: FormData) => {
      await http("/auth/password/update", {
        method: "POST",
        body: JSON.stringify({ password: v.password }),
      });
    },
    onSuccess: () => {
      toast.success("Senha atualizada com sucesso. Faça login com a nova senha.");
      // limpa o token de reset — não é mais válido
      setAccessToken(null);
      navigate({ to: "/login" });
    },
    onError: () => toast.error("Não foi possível atualizar a senha. Solicite um novo link."),
  });

  if (tokenError) {
    return (
      <AuthShell>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Link inválido</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este link de recuperação expirou ou já foi usado.
        </p>
        <Link
          to="/recuperar-senha"
          className="mt-6 inline-block text-sm text-primary hover:underline"
        >
          Solicitar novo link →
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Nova senha</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Escolha uma senha forte para proteger sua conta.
      </p>
      <form onSubmit={handleSubmit((v) => m.mutate(v))} className="mt-8 space-y-4" noValidate>
        <Field label="Nova senha" id="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
        </Field>
        <Field label="Confirmar nova senha" id="confirm" error={errors.confirm?.message}>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            {...register("confirm")}
          />
        </Field>
        <Button type="submit" className="h-11 w-full" disabled={m.isPending}>
          {m.isPending ? "Salvando…" : "Salvar nova senha"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">
            Voltar para entrar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
