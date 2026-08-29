import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ProfileRole, User } from "@/types";
import { supabase } from "@/lib/supabase";

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
  const [role, setRoleState] = useState<ProfileRole>(() => {
    if (typeof window === "undefined") return "usuario";
    const r = window.localStorage.getItem(KEY) as ProfileRole | null;
    return r || "usuario";
  });

  const [isAuthenticated, setAuthenticatedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const authFlag = window.localStorage.getItem(AUTH_KEY) === "1";
    const hasToken = !!window.localStorage.getItem("vidaplus:access_token");
    return authFlag || hasToken;
  });

  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = window.localStorage.getItem(USER_KEY);
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  });

  // Garante sincronização se houver mudanças em outras abas
  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncFromStorage = () => {
      const r = window.localStorage.getItem(KEY) as ProfileRole | null;
      if (r) setRoleState(r);
      const authFlag = window.localStorage.getItem(AUTH_KEY) === "1";
      const hasToken = !!window.localStorage.getItem("vidaplus:access_token");
      setAuthenticatedState(authFlag || hasToken);
      try {
        const stored = window.localStorage.getItem(USER_KEY);
        if (stored) setCurrentUserState(JSON.parse(stored) as User);
      } catch {
        // ignora
      }
    };
    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, []);

  // Sincroniza alteração de cargo (role) em tempo real do banco de dados
  useEffect(() => {
    const client = supabase;
    if (typeof window === "undefined" || !currentUser?.id || !client) return;

    const channel = client
      .channel(`user-role-change:${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${currentUser.id}`,
        },
        (payload: any) => {
          const newRole = payload.new?.role;
          if (newRole && newRole !== role) {
            const updatedUser = { ...currentUser, role: newRole as ProfileRole };
            setCurrentUserState(updatedUser);
            window.localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
            setRole(newRole as ProfileRole);
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [currentUser?.id, role]);

  const setRole = (r: ProfileRole) => {
    setRoleState(r);
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, r);
  };

  const setAuth = (b: boolean) => {
    setAuthenticatedState(b);
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
