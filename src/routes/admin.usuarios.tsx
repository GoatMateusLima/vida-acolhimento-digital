import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { userService } from "@/services";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ProfileRole } from "@/types";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export const Route = createFileRoute("/admin/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — VIDA+" }] }),
  component: Page,
});

const ROLES: ProfileRole[] = ["usuario", "voluntario", "moderador", "administrador"];

function Page() {
  useAuthGuard();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["users"], queryFn: userService.list });
  const m = useMutation({
    mutationFn: ({ id, role }: { id: string; role: ProfileRole }) =>
      userService.updateRole(id, role),
    onSuccess: () => {
      toast.success("Papel atualizado.");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => toast.error("Não foi possível atualizar o papel."),
  });

  return (
    <AppShell>
      <PageHeader
        title="Usuários e papéis"
        description="Gerencie permissões. Confirme antes de aplicar ações críticas."
      />
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3 hidden sm:table-cell">E-mail</th>
              <th className="px-4 py-3">Papel</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(q.data ?? []).map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{u.initials}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <Select
                    defaultValue={u.role}
                    onValueChange={(v) => m.mutate({ id: u.id, role: v as ProfileRole })}
                  >
                    <SelectTrigger className="h-9 w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
