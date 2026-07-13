import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { reportService } from "@/services";
import { fmtRelative, fmtDateTime } from "@/utils/format";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/denuncias")({
  head: () => ({ meta: [{ title: "Minhas denúncias — VIDA+" }] }),
  component: Page,
});

const STATUS_LABEL: Record<string, string> = {
  pendente: "Aguardando análise",
  em_analise: "Em análise pela moderação",
  resolvido: "Resolvida",
  arquivado: "Arquivada",
};

const STATUS_COLOR: Record<string, string> = {
  pendente: "text-amber-600 dark:text-amber-400",
  em_analise: "text-blue-600 dark:text-blue-400",
  resolvido: "text-emerald-600 dark:text-emerald-400",
  arquivado: "text-muted-foreground",
};

function Page() {
  useAuthGuard();

  const [justSent, setJustSent] = useState(false);

  // Detecta se veio direto após enviar uma denúncia
  useEffect(() => {
    if (sessionStorage.getItem("vida:just-reported") === "1") {
      sessionStorage.removeItem("vida:just-reported");
      setJustSent(true);
    }
  }, []);

  // listMine nunca rejeita — usa cache local como fallback quando backend
  // ainda não tem GET /reports/my
  const q = useQuery({
    queryKey: ["my-reports"],
    queryFn: reportService.listMine,
    staleTime: 30_000,
  });

  const list = q.data ?? [];

  return (
    <AppShell>
      <PageHeader
        title="Minhas denúncias"
        description="Acompanhe o status das denúncias que você enviou."
        actions={
          <Button asChild size="sm">
            <Link to="/app/denuncia">Nova denúncia</Link>
          </Button>
        }
      />

      {/* Banner de confirmação quando veio direto do formulário */}
      {justSent && (
        <div className="mb-5 rounded-2xl border border-emerald-300/60 bg-emerald-50/60 p-4 dark:bg-emerald-950/20">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Denúncia registrada com sucesso
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Nossa equipe irá analisar o caso. O status aparece abaixo e será atualizado conforme
                a análise avança.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Skeleton enquanto carrega */}
      {q.isPending && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {/* Lista vazia */}
      {!q.isPending && list.length === 0 && (
        <EmptyState
          icon={ShieldAlert}
          title="Nenhuma denúncia enviada"
          description="Quando você enviar uma denúncia, ela aparecerá aqui com o status de análise."
        />
      )}

      {/* Lista de denúncias */}
      {list.length > 0 && (
        <ul className="divide-y rounded-2xl border bg-card">
          {list.map((r) => (
            <li key={r.id} className="px-4 py-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <div className="min-w-0 space-y-1">
                  {/* Motivo + alvo */}
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{r.reason}</p>
                    <span className="text-xs text-muted-foreground">
                      · contra {r.reportedAlias}
                    </span>
                  </div>

                  {/* Data */}
                  <p className="text-xs text-muted-foreground">
                    Enviada {fmtRelative(r.createdAt)}
                  </p>

                  {/* Trecho dos detalhes */}
                  {r.details && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{r.details}</p>
                  )}

                  {/* Linha do tempo de atualizações */}
                  {r.history.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-l-2 border-primary/20 pl-3">
                      {r.history.map((h, i) => (
                        <div key={i} className="text-xs">
                          <span className="font-medium text-foreground">{h.action}</span>
                          <span className="text-muted-foreground"> — {fmtDateTime(h.at)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status badge + label legível */}
                <div className="shrink-0 text-right">
                  <StatusBadge status={r.status} />
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      STATUS_COLOR[r.status] ?? "text-muted-foreground",
                    )}
                  >
                    {STATUS_LABEL[r.status] ?? r.status}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Nota de privacidade */}
      <div className="mt-6 flex items-start gap-3 rounded-xl bg-muted/50 p-4">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Sua identidade é protegida. A equipe de moderação analisa cada caso individualmente sem
          revelar quem fez a denúncia ao denunciado.
        </p>
      </div>
    </AppShell>
  );
}
