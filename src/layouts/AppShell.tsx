import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Home,
  MessageCircle,
  History,
  User,
  Heart,
  Users,
  Shield,
  BarChart3,
  FileWarning,
  ClipboardList,
  LogOut,
  Settings,
  MoreHorizontal,
  UsersRound,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ProfileSwitcher } from "@/components/common/ProfileSwitcher";
import { InstallButton } from "@/components/pwa/InstallButton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { ProfileRole } from "@/types";
import { clearSession, http } from "@/services/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatService, userService } from "@/services";
import { toast } from "sonner";

type Item = { to: string; label: string; icon: typeof Home };

const NAV: Record<ProfileRole, Item[]> = {
  usuario: [
    { to: "/app", label: "Início", icon: Home },
    { to: "/app/conversar", label: "Conversar", icon: MessageCircle },
    { to: "/app/comunidades", label: "Grupos", icon: UsersRound },
    { to: "/app/historico", label: "Histórico", icon: History },
    { to: "/app/denuncias", label: "Denúncias", icon: FileWarning },
    { to: "/app/perfil", label: "Perfil", icon: User },
  ],
  voluntario: [
    { to: "/vol", label: "Painel", icon: Heart },
    { to: "/vol/fila", label: "Fila", icon: Users },
    { to: "/vol/historico", label: "Histórico", icon: History },
    { to: "/vol/candidatura", label: "Candidatura", icon: ClipboardList },
  ],
  moderador: [{ to: "/mod", label: "Denúncias", icon: Shield }],
  administrador: [
    { to: "/admin", label: "Dashboard", icon: BarChart3 },
    { to: "/admin/candidaturas", label: "Candidaturas", icon: ClipboardList },
    { to: "/admin/moderadores", label: "Moderadores", icon: Shield },
    { to: "/admin/usuarios", label: "Usuários", icon: Users },
    { to: "/admin/comunidades", label: "Grupos", icon: UsersRound },
  ],
};

export function AppShell({ children }: { children: ReactNode }) {
  const { role, setAuthenticated, setCurrentUser } = useProfile();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [chatOpen, setChatOpen] = useState(false);
  const qc = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => userService.me(),
    enabled: ["voluntario", "moderador", "administrador"].includes(role),
  });

  const teamQuery = useQuery({
    queryKey: ["team-users"],
    queryFn: () => userService.listTeam(),
    enabled: chatOpen && ["voluntario", "moderador", "administrador"].includes(role),
  });

  const startTeamChat = useMutation({
    mutationFn: (targetId: string) => chatService.startTeamChat(targetId),
    onSuccess: (newConv) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setChatOpen(false);
      navigate({ to: "/vol/chat/$id", params: { id: newConv.id } });
    },
    onError: () => {
      toast.error("Não foi possível iniciar o chat privado com este colega.");
    },
  });

  const admins = (teamQuery.data ?? []).filter(u => u.role === "administrador" && u.id !== meQuery.data?.id);
  const moderators = (teamQuery.data ?? []).filter(u => u.role === "moderador" && u.id !== meQuery.data?.id);
  const volunteers = (teamQuery.data ?? []).filter(u => u.role === "voluntario" && u.id !== meQuery.data?.id);

  async function handleLogout() {
    try {
      await http("/auth/logout", { method: "POST" });
    } catch {
      // ignora erro de rede — limpa sessão mesmo assim
    }
    clearSession();
    setAuthenticated(false);
    setCurrentUser(null);
    navigate({ to: "/login", replace: true });
  }
  const routeRole: ProfileRole =
    pathname === "/app/preferencias"
      ? role
      : pathname.startsWith("/vol")
        ? "voluntario"
        : pathname.startsWith("/mod")
          ? "moderador"
          : pathname.startsWith("/admin")
            ? "administrador"
            : "usuario";
  const items = NAV[routeRole] ?? NAV[role];
  const [moreOpen, setMoreOpen] = useState(false);
  const mobileItems =
    items.length < 4
      ? [...items, { to: "#more", label: "Mais", icon: MoreHorizontal }]
      : items.slice(0, 3).concat({ to: "#more", label: "Mais", icon: MoreHorizontal });

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        <div className="px-4 py-4">
          <Link to="/app">
            <Logo />
          </Link>
        </div>
        <nav aria-label="Navegação" className="flex-1 px-3 pb-4">
          <ul className="space-y-1">
            {items.map((i) => (
              <NavLink key={i.to} item={i} />
            ))}
          </ul>
          <div className="mt-6 border-t pt-4 space-y-1">
            <NavLink item={{ to: "/app/preferencias", label: "Preferências", icon: Settings }} />
          </div>
        </nav>
        <div className="border-t p-3">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur safe-top">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 md:px-6">
            <div className="md:hidden">
              <Link to="/app">
                <Logo />
              </Link>
            </div>
            <div className="hidden md:block" />
            <div className="flex items-center justify-end gap-2">
              <div className="hidden sm:block">
                <InstallButton />
              </div>
              <ProfileSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>

        {/* Bottom nav mobile */}
        <nav
          aria-label="Navegação inferior"
          className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur safe-bottom md:hidden"
        >
          <ul
            className="grid"
            style={{ gridTemplateColumns: `repeat(${mobileItems.length}, minmax(0, 1fr))` }}
          >
            {mobileItems.map((i) => (
              <li key={i.to}>
                {i.to === "#more" ? (
                  <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                    <SheetTrigger asChild>
                      <button className="flex h-16 w-full flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground">
                        <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                        <span>Mais</span>
                      </button>
                    </SheetTrigger>
                    <SheetContent
                      side="bottom"
                      className="rounded-t-3xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
                    >
                      <SheetTitle>Mais opções</SheetTitle>
                      <div className="mt-4 grid gap-2">
                        {items.slice(3).map((item) => (
                          <MobileMenuLink
                            key={item.to}
                            item={item}
                            close={() => setMoreOpen(false)}
                          />
                        ))}
                        <MobileMenuLink
                          item={{ to: "/app/preferencias", label: "Preferências", icon: Settings }}
                          close={() => setMoreOpen(false)}
                        />
                        <div className="mt-1" onClick={() => setMoreOpen(false)}>
                          <InstallButton fullWidth />
                        </div>
                        <button
                          onClick={() => {
                            handleLogout();
                            setMoreOpen(false);
                          }}
                          className="mt-2 flex h-12 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-destructive hover:bg-destructive/10"
                        >
                          <LogOut className="h-5 w-5" /> Sair
                        </button>
                      </div>
                    </SheetContent>
                  </Sheet>
                ) : (
                  <Link
                    to={i.to}
                    className="flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground"
                    activeProps={{ className: "text-primary" }}
                    activeOptions={{
                      exact:
                        i.to === "/app" || i.to === "/vol" || i.to === "/mod" || i.to === "/admin",
                    }}
                  >
                    <i.icon className="h-5 w-5" aria-hidden="true" />
                    <span>{i.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {["voluntario", "moderador", "administrador"].includes(role) && (
          <>
            {/* Botão flutuante no canto */}
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/95 transition-all focus:outline-none cursor-pointer"
              aria-label="Abrir chat de equipe"
            >
              {chatOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </button>

            {/* Painel do Chat flutuante */}
            {chatOpen && (
              <div className="fixed bottom-24 right-6 z-50 flex h-[480px] w-80 flex-col rounded-2xl border bg-card text-card-foreground shadow-2xl animate-in fade-in slide-in-from-bottom-5">
                <div className="flex items-center justify-between border-b px-4 py-3 bg-primary text-primary-foreground rounded-t-2xl">
                  <h3 className="font-semibold text-sm">Contatos da Equipe</h3>
                  <button onClick={() => setChatOpen(false)} aria-label="Fechar painel" className="cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {teamQuery.isPending && (
                    <p className="text-xs text-muted-foreground text-center py-4">Carregando equipe...</p>
                  )}

                  {/* 1. Administradores */}
                  {admins.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Administradores</h4>
                      <div className="space-y-1">
                        {admins.map(u => (
                          <button
                            key={u.id}
                            disabled={startTeamChat.isPending}
                            onClick={() => startTeamChat.mutate(u.id)}
                            className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-muted/40 transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span className="font-medium">{u.name}</span>
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Moderadores */}
                  {moderators.length > 0 && (
                    <div className="border-t pt-3">
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Moderadores</h4>
                      <div className="space-y-1">
                        {moderators.map(u => (
                          <button
                            key={u.id}
                            disabled={startTeamChat.isPending}
                            onClick={() => startTeamChat.mutate(u.id)}
                            className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-muted/40 transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span className="font-medium">{u.name}</span>
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Voluntários */}
                  {volunteers.length > 0 && (
                    <div className="border-t pt-3">
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Voluntários</h4>
                      <div className="space-y-1">
                        {volunteers.map(u => (
                          <button
                            key={u.id}
                            disabled={startTeamChat.isPending}
                            onClick={() => startTeamChat.mutate(u.id)}
                            className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-muted/40 transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span className="font-medium">{u.name}</span>
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!teamQuery.isPending && (admins.length + moderators.length + volunteers.length) === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhum outro membro da equipe.</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MobileMenuLink({ item, close }: { item: Item; close: () => void }) {
  return (
    <Link
      to={item.to}
      onClick={close}
      className="flex h-12 items-center gap-3 rounded-xl bg-muted/50 px-3 text-sm font-medium hover:bg-muted"
    >
      <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

function NavLink({ item }: { item: Item }) {
  const { pathname } = useLocation();
  const active = pathname === item.to || (item.to !== "/app" && pathname.startsWith(item.to));
  return (
    <li>
      <Link
        to={item.to}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{item.label}</span>
      </Link>
    </li>
  );
}
