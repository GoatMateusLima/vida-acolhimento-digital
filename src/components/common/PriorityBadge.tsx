import { cn } from "@/lib/utils";
import type { QueuePriority } from "@/types";

const STYLES: Record<QueuePriority, string> = {
  normal: "bg-muted text-foreground",
  prioritaria: "bg-[color-mix(in_oklab,var(--warning)_22%,transparent)] text-foreground",
  crise: "bg-[color-mix(in_oklab,var(--destructive)_18%,transparent)] text-destructive",
};
const LABEL: Record<QueuePriority, string> = { normal: "Normal", prioritaria: "Prioritária", crise: "Crise" };

export function PriorityBadge({ priority }: { priority: QueuePriority }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", STYLES[priority])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {LABEL[priority]}
    </span>
  );
}
