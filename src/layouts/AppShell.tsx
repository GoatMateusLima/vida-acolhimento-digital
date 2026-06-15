import { Link, useLocation } from "@tanstack/react-router";
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
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ProfileSwitcher } from "@/components/common/ProfileSwitcher";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { ProfileRole } from "@/types";

type Item = { to: string; label: string; icon: typeof Home };

const NAV: Record<ProfileRole, Item[]> = {
  usuario: [
    { to: "/app", label: "Início", icon: Home },
    { to: "/app/conversar", label: "Conversar", icon: MessageCircle },
    { to: "/app/comunidades", label: "Grupos", icon: UsersRound },
    { to: "/app/historico", label: "Histórico", icon: History },
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
    { to: "/admin/usuarios", label: "Usuários", icon: Users },
  ],
};

export function AppShell({ children }: { children: ReactNode }) {
  const { role, setAuthenticated } = useProfile();
  const { pathname } = useLocation();
  const routeRole: ProfileRole = pathname.startsWith("/vol")
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
            <NavLink item={{ to: "/app/denuncia", label: "Denunciar", icon: FileWarning }} />
          </div>
        </nav>
        <div className="border-t p-3">
          <Link to="/login" onClick={() => setAuthenticated(false)}>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </Link>
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
                        <MobileMenuLink
                          item={{ to: "/app/denuncia", label: "Denunciar", icon: FileWarning }}
                          close={() => setMoreOpen(false)}
                        />
                        <Link
                          to="/login"
                          onClick={() => {
                            setAuthenticated(false);
                            setMoreOpen(false);
                          }}
                          className="mt-2 flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-destructive hover:bg-destructive/10"
                        >
                          <LogOut className="h-5 w-5" /> Sair
                        </Link>
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
