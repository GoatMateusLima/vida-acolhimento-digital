import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ProfileRole, User } from "@/types";

type Ctx = {
  role: ProfileRole;
  setRole: (r: ProfileRole) => void;
  isAuthenticated: boolean;
  setAuthenticated: (b: boolean) => void;
  /** Usuário completo retornado pela API após login. Null se não autenticado. */
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
};

const ProfileContext = createContext<Ctx | null>(null);

const KEY = "vidaplus:role";
const AUTH_KEY = "vidaplus:auth";
const USER_KEY = "vidaplus:user";

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<ProfileRole>("usuario");
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);

  // Restaura estado da sessão ao iniciar
  useEffect(() => {
    if (typeof window === "undefined") return;
    const r = window.localStorage.getItem(KEY) as ProfileRole | null;
    if (r) setRoleState(r);
    setAuthenticated(window.localStorage.getItem(AUTH_KEY) === "1");
    try {
      const stored = window.localStorage.getItem(USER_KEY);
      if (stored) setCurrentUserState(JSON.parse(stored) as User);
    } catch {
      // ignora JSON corrompido
    }
  }, []);

  const setRole = (r: ProfileRole) => {
    setRoleState(r);
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, r);
  };

  const setAuth = (b: boolean) => {
    setAuthenticated(b);
    if (typeof window !== "undefined") {
      if (b) window.localStorage.setItem(AUTH_KEY, "1");
      else window.localStorage.removeItem(AUTH_KEY);
    }
  };

  const setCurrentUser = (u: User | null) => {
    setCurrentUserState(u);
    if (typeof window === "undefined") return;
    if (u) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(u));
      // Sincroniza a role com o objeto do usuário
      setRole(u.role);
    } else {
      window.localStorage.removeItem(USER_KEY);
    }
  };

  const value = useMemo(
    () => ({
      role,
      setRole,
      isAuthenticated,
      setAuthenticated: setAuth,
      currentUser,
      setCurrentUser,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [role, isAuthenticated, currentUser],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile deve estar dentro de ProfileProvider");
  return ctx;
}
