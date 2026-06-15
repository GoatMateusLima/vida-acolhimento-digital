import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export function InstallButton() {
  const { canInstall, install } = useInstallPrompt();
  if (!canInstall) return null;
  return (
    <Button onClick={install} variant="outline" size="sm" className="gap-2">
      <Download className="h-4 w-4" />
      Instalar aplicativo
    </Button>
  );
}
