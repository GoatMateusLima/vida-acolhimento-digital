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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const banMutation = useMutation({
    mutationFn: ({ id, ban }: { id: string; ban: boolean }) => userService.ban(id, ban),
    onSuccess: (_, variables) => {
      toast.success(variables.ban ? "Usuário suspenso com sucesso." : "Usuário reativado.");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => toast.error("Não foi possível alterar o status do usuário."),
  });

  const userDetailsQuery = useQuery({
    queryKey: ["user-details", selectedUserId],
    queryFn: () => userService.getDetails(selectedUserId!),
    enabled: !!selectedUserId,
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
              <th className="px-4 py-3 text-right">Ações</th>
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
                    <span className="font-medium">
                      {u.name}
                      {u.status === "banido" && (
                        <span className="ml-2 text-[10px] bg-destructive/15 text-destructive px-1.5 py-0.5 rounded font-bold">Suspenso</span>
                      )}
                    </span>
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
                <td className="px-4 py-3 text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedUserId(u.id)}
                  >
                    Detalhes
                  </Button>
                  <Button
                    variant={u.status === "banido" ? "secondary" : "destructive"}
                    size="sm"
                    onClick={() => {
                      if (window.confirm(`Deseja realmente ${u.status === "banido" ? "reativar" : "suspender"} este usuário?`)) {
                        banMutation.mutate({ id: u.id, ban: u.status !== "banido" });
                      }
                    }}
                    disabled={banMutation.isPending}
                  >
                    {u.status === "banido" ? "Reativar" : "Banir"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dialog para exibir detalhes do usuário (exclusivo admin) */}
      <Dialog open={!!selectedUserId} onOpenChange={(open) => { if (!open) setSelectedUserId(null); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Informações Administrativas do Usuário</DialogTitle>
            <DialogDescription>
              Dados detalhados e controle de acesso exclusivo de administração.
            </DialogDescription>
          </DialogHeader>
          {userDetailsQuery.isPending && (
            <p className="text-center py-4 text-sm text-muted-foreground">Carregando informações...</p>
          )}
          {userDetailsQuery.data && (
            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-2 gap-4 border-b pb-3">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Nome de Exibição</p>
                  <p className="font-semibold text-foreground mt-0.5">{userDetailsQuery.data.name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Apelido (Nickname)</p>
                  <p className="font-semibold text-foreground mt-0.5">{userDetailsQuery.data.profile?.nickname || "Não definido"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-b pb-3">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">E-mail (Privado)</p>
                  <p className="font-medium text-foreground mt-0.5">{userDetailsQuery.data.email}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Cargo / Permissão</p>
                  <p className="font-semibold text-primary mt-0.5 capitalize">{userDetailsQuery.data.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b pb-3">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Estado da Conta</p>
                  <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium mt-1 ${
                    userDetailsQuery.data.status === 'banido' ? 'bg-destructive/15 text-destructive' : 'bg-green-100 text-green-800'
                  }`}>
                    {userDetailsQuery.data.status === 'banido' ? 'Suspenso' : 'Ativo'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Localização / Estado</p>
                  <p className="font-semibold text-foreground mt-0.5 uppercase">{userDetailsQuery.data.profile?.state || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b pb-3">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Ano de Nascimento</p>
                  <p className="font-medium text-foreground mt-0.5">{userDetailsQuery.data.profile?.birth_year || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Criado em</p>
                  <p className="font-medium text-foreground mt-0.5">{new Date(userDetailsQuery.data.joinedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUserId(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
