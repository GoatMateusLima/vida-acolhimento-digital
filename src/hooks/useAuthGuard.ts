import { useEffect } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useProfile } from "@/contexts/ProfileContext";
import type { ProfileRole } from "@/types";

/**
 * Redireciona o usuário se não estiver autenticado ou se a role não bater
 * com o prefixo da rota atual.
 *
 * Uso: chame no início de qualquer página protegida.
 *
 * Mapa de prefixo → role mínima:
 *   /app  → qualquer role autenticada
 *   /vol  → voluntario | moderador | administrador
 *   /mod  → moderador  | administrador
 *   /admin → administrador
 */

const PREFIX_ROLE: Array<{ prefix: string; role: ProfileRole }> = [
  { prefix: "/admin", role: "administrador" },
  { prefix: "/mod", role: "moderador" },
  { prefix: "/vol", role: "voluntario" },
  { prefix: "/app", role: "usuario" },
];

export function useAuthGuard() {
  const { isAuthenticated, role } = useProfile();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login", replace: true });
      return;
    }

    if (pathname === "/app/preferencias") return;
    const match = PREFIX_ROLE.find((p) => pathname.startsWith(p.prefix));
    if (!match) return;

    if (role !== match.role) {
      // Redireciona para a área correta da role atual
      const home = roleHome(role);
      navigate({ to: home, replace: true });
    }
  }, [isAuthenticated, role, pathname, navigate]);
}

/**
 * Retorna a rota home para cada role.
 */
export function roleHome(role: ProfileRole): string {
  switch (role) {
    case "administrador":
      return "/admin";
    case "moderador":
      return "/mod";
    case "voluntario":
      return "/vol";
    default:
      return "/app";
  }
}
