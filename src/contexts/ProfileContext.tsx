import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ProfileRole } from "@/types";

type Ctx = {
  role: ProfileRole;
  setRole: (r: ProfileRole) => void;
  isAuthenticated: boolean;
  setAuthenticated: (b: boolean) => void;
};

const ProfileContext = createContext<Ctx | null>(null);
const KEY = "vidaplus:role";
const AUTH_KEY = "vidaplus:auth";

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<ProfileRole>("usuario");
  const [isAuthenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const r = window.localStorage.getItem(KEY) as ProfileRole | null;
    if (r) setRoleState(r);
    setAuthenticated(window.localStorage.getItem(AUTH_KEY) === "1");
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

  const value = useMemo(
    () => ({ role, setRole, isAuthenticated, setAuthenticated: setAuth }),
    [role, isAuthenticated],
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile deve estar dentro de ProfileProvider");
  return ctx;
}
