import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  online: "bg-[color-mix(in_oklab,var(--success)_25%,transparent)] text-foreground",
  ocupado: "bg-[color-mix(in_oklab,var(--warning)_25%,transparent)] text-foreground",
  offline: "bg-muted text-muted-foreground",
  pendente: "bg-muted text-foreground",
  em_analise: "bg-[color-mix(in_oklab,var(--info)_22%,transparent)] text-foreground",
  resolvido: "bg-[color-mix(in_oklab,var(--success)_22%,transparent)] text-foreground",
  arquivado: "bg-muted text-muted-foreground",
  aprovado: "bg-[color-mix(in_oklab,var(--success)_22%,transparent)] text-foreground",
  recusado: "bg-[color-mix(in_oklab,var(--destructive)_18%,transparent)] text-destructive",
  waiting: "bg-[color-mix(in_oklab,var(--warning)_22%,transparent)] text-foreground",
  active: "bg-[color-mix(in_oklab,var(--success)_22%,transparent)] text-foreground",
  ended: "bg-muted text-muted-foreground",
};

const labels: Record<string, string> = {
  online: "Online", ocupado: "Ocupado", offline: "Offline",
  pendente: "Pendente", em_analise: "Em análise", resolvido: "Resolvido", arquivado: "Arquivado",
  aprovado: "Aprovado", recusado: "Recusado",
  waiting: "Aguardando", active: "Em andamento", ended: "Encerrada",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", map[status] ?? "bg-muted text-foreground")}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {labels[status] ?? status}
    </span>
  );
}
