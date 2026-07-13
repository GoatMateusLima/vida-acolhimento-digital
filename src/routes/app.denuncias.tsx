import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, ShieldAlert } from "lucide-react";
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

  // Lê o sinal de "acabou de enviar" do sessionStorage e limpa logo em seguida
  useEffect(() => {
    if (sessionStorage.getItem("vida:just-reported") === "1") {
      sessionStorage.removeItem("vida:just-reported");
      setJustSent(true);
    }
  }, []);

  const q = useQuery({
    queryKey: ["my-reports"],
    queryFn: reportService.listMine,
    retry: false, // se o backend não tem o endpoint ainda, não fica tentando
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

      {/* Confirmação de envio recente */}
      {justSent && (
        <div className="mb-5 rounded-2xl border border-emerald-300/60 bg-emerald-50/60 p-4 dark:bg-emerald-950/20">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Denúncia registrada com sucesso
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Nossa equipe irá analisar o caso. Você será notificado por e-mail sobre
                atualizações. A lista abaixo atualiza automaticamente quando o histórico ficar
                disponível.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {q.isPending && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {/* Backend ainda não implementou GET /reports/my */}
      {q.isError && !justSent && (
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50/60 p-5 dark:bg-amber-950/20">
          <div className="flex gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium">Histórico em implementação</p>
              <p className="mt-1 text-xs text-muted-foreground">
                O acompanhamento de denúncias está sendo desenvolvido. Suas denúncias estão
                registradas e serão analisadas. Você receberá atualizações por e-mail.
              </p>
            </div>
          </div>
        </div>
      )}

      {q.isError && justSent && (
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50/60 p-5 dark:bg-amber-950/20">
          <div className="flex gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium">Histórico ainda não disponível</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Sua denúncia foi recebida com sucesso. O histórico detalhado ficará visível aqui
                assim que o recurso for ativado.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista vazia */}
      {!q.isPending && !q.isError && list.length === 0 && (
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
            <li key={r.id} className="px-4 py-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  {/* Cabeçalho */}
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{r.reason}</p>
                    <span className="text-xs text-muted-foreground">contra {r.reportedAlias}</span>
                  </div>

                  {/* Data de envio */}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Enviada {fmtRelative(r.createdAt)}
                  </p>

                  {/* Trecho dos detalhes */}
                  {r.details && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.details}</p>
                  )}

                  {/* Linha do tempo */}
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

                {/* Status */}
                <div className="shrink-0 text-right">
                  <StatusBadge status={r.status} />
                  <p className={cn("mt-1 text-[10px]", STATUS_COLOR[r.status] ?? "text-muted-foreground")}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Aviso de privacidade */}
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
