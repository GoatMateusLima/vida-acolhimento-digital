import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Archive, MessageCircle, PauseCircle, PlayCircle, Plus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminCommunityService } from "@/services";
import type { AdminCommunityStatus } from "@/types";

export const Route = createFileRoute("/admin/comunidades/")({
  head: () => ({ meta: [{ title: "Gestão de grupos — VIDA+" }] }),
  component: Page,
});

function Page() {
  const queryClient = useQueryClient();
  const groups = useQuery({ queryKey: ["admin-communities"], queryFn: adminCommunityService.list });
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const create = useMutation({
    mutationFn: adminCommunityService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-communities"] });
      setName("");
      setDescription("");
      setShowCreate(false);
      toast.success("Grupo criado.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o grupo.");
    },
  });
  const status = useMutation({
    mutationFn: ({ id, value }: { id: string; value: AdminCommunityStatus }) =>
      adminCommunityService.updateStatus(id, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-communities"] });
      toast.success("Status do grupo atualizado.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o grupo.");
    },
  });

  return (
    <AppShell>
      <PageHeader
        title="Gestão de grupos"
        description="Controle comunidades, participantes e atividade da plataforma."
        actions={
          <Button className="gap-2" onClick={() => setShowCreate((value) => !value)}>
            <Plus className="h-4 w-4" /> Novo grupo
          </Button>
        }
      />

      {showCreate && (
        <section className="mb-6 rounded-2xl border bg-card p-5">
          <h2 className="font-semibold">Criar grupo</h2>
          <div className="mt-3 grid gap-3">
            <Input
              placeholder="Nome do grupo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Textarea
              placeholder="Descrição e objetivo do grupo"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
              <Button
                disabled={name.trim().length < 3 || create.isPending}
                onClick={() =>
                  create.mutate({ name: name.trim(), description: description.trim() })
                }
              >
                Criar grupo
              </Button>
            </div>
          </div>
        </section>
      )}

      {groups.isError && (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {groups.error instanceof Error
            ? groups.error.message
            : "Não foi possível carregar os grupos."}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {(groups.data ?? []).map((group) => (
          <article key={group.id} className="rounded-3xl border bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {group.status}
                </span>
                <h2 className="mt-1 font-display text-xl font-semibold">{group.name}</h2>
              </div>
              <StatusDot status={group.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{group.description}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric icon={UsersRound} label="Participantes" value={group.memberCount} />
              <Metric icon={MessageCircle} label="Mensagens" value={group.messageCount} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to="/admin/comunidades/$id" params={{ id: group.id }}>
                  Gerenciar
                </Link>
              </Button>
              {group.status !== "ativo" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => status.mutate({ id: group.id, value: "ativo" })}
                >
                  <PlayCircle className="mr-1.5 h-4 w-4" /> Ativar
                </Button>
              )}
              {group.status === "ativo" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => status.mutate({ id: group.id, value: "pausado" })}
                >
                  <PauseCircle className="mr-1.5 h-4 w-4" /> Pausar
                </Button>
              )}
              {group.status !== "arquivado" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => status.mutate({ id: group.id, value: "arquivado" })}
                >
                  <Archive className="mr-1.5 h-4 w-4" /> Arquivar
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersRound;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function StatusDot({ status }: { status: AdminCommunityStatus }) {
  const color =
    status === "ativo" ? "bg-emerald-500" : status === "pausado" ? "bg-amber-500" : "bg-slate-400";
  return <span className={`mt-1 h-3 w-3 rounded-full ${color}`} aria-label={`Status ${status}`} />;
}
