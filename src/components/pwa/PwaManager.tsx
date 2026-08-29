import { useEffect, useState } from "react";
import { toast } from "sonner";

export function PwaManager() {
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (registered || typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const register = async () => {
      try {
        if (import.meta.env.DEV) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
          const cacheKeys = await caches.keys();
          await Promise.all(
            cacheKeys
              .filter((key) => key.startsWith("vida-plus-"))
              .map((key) => caches.delete(key)),
          );
          setRegistered(true);
          return;
        }

        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        await registration.update();
        setRegistered(true);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              toast.info("Uma nova versão do VIDA+ está disponível.", {
                action: { label: "Atualizar", onClick: () => window.location.reload() },
              });
            }
          });
        });
      } catch {
        // Falha silenciosa de registro de PWA
      }
    };
    void register();
  }, [registered]);

  return null;
}
