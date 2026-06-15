import { WifiOff } from "lucide-react";
import { useOnline } from "@/hooks/useOnline";

export function OfflineIndicator() {
  const online = useOnline();
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-2 top-2 z-50 mx-auto flex max-w-md items-center gap-2 rounded-xl bg-foreground/90 px-3 py-2 text-sm text-background shadow-soft backdrop-blur"
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      <span>Sem conexão. Você ainda pode navegar pelas páginas já carregadas.</span>
    </div>
  );
}
