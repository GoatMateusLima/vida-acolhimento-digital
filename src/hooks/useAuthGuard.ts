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

const ROLE_ORDER: Record<ProfileRole, number> = {
  usuario: 1,
  voluntario: 2,
  moderador: 3,
  administrador: 4,
};

const PREFIX_MIN_ROLE: Array<{ prefix: string; minRole: ProfileRole }> = [
  { prefix: "/admin", minRole: "administrador" },
  { prefix: "/mod", minRole: "moderador" },
  { prefix: "/vol", minRole: "voluntario" },
  { prefix: "/app", minRole: "usuario" },
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

    const match = PREFIX_MIN_ROLE.find((p) => pathname.startsWith(p.prefix));
    if (!match) return;

    const userLevel = ROLE_ORDER[role] ?? 0;
    const requiredLevel = ROLE_ORDER[match.minRole] ?? 0;

    if (userLevel < requiredLevel) {
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
