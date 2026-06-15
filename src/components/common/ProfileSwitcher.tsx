import { useNavigate } from "@tanstack/react-router";
import { useProfile } from "@/contexts/ProfileContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProfileRole } from "@/types";

const LABEL: Record<ProfileRole, string> = {
  usuario: "Usuário",
  voluntario: "Voluntário",
  moderador: "Moderador",
  administrador: "Administrador",
};

const HOME: Record<ProfileRole, string> = {
  usuario: "/app",
  voluntario: "/vol",
  moderador: "/mod",
  administrador: "/admin",
};

export function ProfileSwitcher() {
  const { role, setRole, setAuthenticated } = useProfile();
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs font-medium uppercase tracking-wider text-muted-foreground sm:inline">
        Demo
      </span>
      <Select
        value={role}
        onValueChange={(v) => {
          const r = v as ProfileRole;
          setRole(r);
          setAuthenticated(true);
          navigate({ to: HOME[r] });
        }}
      >
        <SelectTrigger className="h-9 w-[180px]" aria-label="Trocar perfil de demonstração">
          <SelectValue placeholder="Perfil" />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(LABEL) as ProfileRole[]).map((k) => (
            <SelectItem key={k} value={k}>
              Perfil: {LABEL[k]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
