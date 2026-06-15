import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { cn } from "@/lib/utils";

interface InstallButtonProps {
  fullWidth?: boolean;
}

export function InstallButton({ fullWidth }: InstallButtonProps) {
  const { canInstall, install } = useInstallPrompt();
  if (!canInstall) return null;
  return (
    <Button
      onClick={install}
      variant="outline"
      size="sm"
      className={cn("gap-2", fullWidth && "w-full h-12 justify-start text-sm font-medium px-3")}
    >
      <Download className="h-4 w-4 shrink-0 text-primary" />
      Instalar aplicativo
    </Button>
  );
}
