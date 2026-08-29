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
import { useState, useRef, useEffect, type ReactNode } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ProfileSwitcher } from "@/components/common/ProfileSwitcher";
import { InstallButton } from "@/components/pwa/InstallButton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
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
  });

  const teamQuery = useQuery({
    queryKey: ["team-users"],
    queryFn: () => userService.listTeam(),
    enabled: chatOpen,
  });

  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const client = supabase;
    const isStaff = ["voluntario", "moderador", "administrador"].includes(role);
    if (!client || !meQuery.data?.id || !isStaff) return;

    const channel = client.channel("room:staff-presence");

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const activeIds = new Set<string>();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.userId) activeIds.add(p.userId);
          });
        });
        setOnlineUsers(activeIds);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId: meQuery.data.id,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      client.removeChannel(channel);
    };
  }, [meQuery.data?.id, role]);
  const [chatView, setChatView] = useState<"categories" | "category-list" | "conversation">("categories");
  const [selectedCategory, setSelectedCategory] = useState<"administrador" | "moderador" | "voluntario" | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeRecipient, setActiveRecipient] = useState<any | null>(null);
  const [modalMessageText, setModalMessageText] = useState("");

  const startTeamChat = useMutation({
    mutationFn: (targetId: string) => chatService.startTeamChat(targetId),
    onSuccess: (newConv) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setActiveConversationId(newConv.id);
      setChatView("conversation");
    },
    onError: () => {
      toast.error("Não foi possível iniciar o chat privado com este colega.");
    },
  });

  const modalMessagesQuery = useQuery({
    queryKey: ["modal-messages", activeConversationId],
    queryFn: () => chatService.getMessages(activeConversationId!),
    enabled: !!activeConversationId && chatView === "conversation" && chatOpen,
    refetchInterval: 3000,
  });

  const sendModalMessage = useMutation({
    mutationFn: (text: string) => chatService.sendMessage(activeConversationId!, text, "volunteer"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modal-messages", activeConversationId] });
    },
  });

  // Escuta novas mensagens de equipe em tempo real para exibir notificações (Toasts)
  useEffect(() => {
    const client = supabase;
    const isStaff = ["voluntario", "moderador", "administrador"].includes(role);
    if (!client || !meQuery.data?.id || !isStaff) return;

    const channel = client
      .channel("staff-messages-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload: any) => {
          const newMsg = payload.new;
          if (!newMsg || newMsg.sender_id === meQuery.data.id) return;

          // Valida se pertence a um chat de equipe
          const { data: conv } = await client
            .from("conversations")
            .select("is_team_chat, user_id, volunteer_id")
            .eq("id", newMsg.conversation_id)
            .maybeSingle();

          if (conv?.is_team_chat) {
            const senderId = conv.user_id === meQuery.data.id ? conv.volunteer_id : conv.user_id;
            const sender = (teamQuery.data ?? []).find((u) => u.id === senderId);
            const senderName = sender?.name ?? "Um colega";

            // Só notifica se não estiver com a conversa aberta no modal
            if (activeConversationId !== newMsg.conversation_id || !chatOpen || chatView !== "conversation") {
              toast(`Nova mensagem de ${senderName}`, {
                description: "Clique em abrir para ler a conversa.",
                action: {
                  label: "Abrir",
                  onClick: () => {
                    if (sender) setActiveRecipient(sender);
                    setActiveConversationId(newMsg.conversation_id);
                    setChatView("conversation");
                    setChatOpen(true);
                  },
                },
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [meQuery.data?.id, role, teamQuery.data, activeConversationId, chatOpen, chatView]);

  // Debug da listagem e mapeamento para garantir exibição correta
  const rawTeamData = teamQuery.data ?? [];
  const currentUserId = meQuery.data?.id;

  const admins = rawTeamData.filter(u => u.role === "administrador" && u.id !== currentUserId);
  const moderators = rawTeamData.filter(u => u.role === "moderador" && u.id !== currentUserId);
  const volunteers = rawTeamData.filter(u => u.role === "voluntario" && u.id !== currentUserId);

  const modalScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatView === "conversation") {
      modalScrollRef.current?.scrollTo({ top: modalScrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [modalMessagesQuery.data?.length, chatView]);

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
              <div className="fixed bottom-24 right-6 z-50 flex h-[480px] w-80 flex-col rounded-2xl border bg-card text-card-foreground shadow-2xl animate-in fade-in slide-in-from-bottom-5 overflow-hidden">
                {chatView === "categories" && (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between border-b px-4 py-3 bg-primary text-primary-foreground rounded-t-2xl">
                      <h3 className="font-semibold text-sm">Contatos da Equipe</h3>
                      <button onClick={() => setChatOpen(false)} aria-label="Fechar painel" className="cursor-pointer">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                      <button
                        onClick={() => { setSelectedCategory("administrador"); setChatView("category-list"); }}
                        className="w-full flex items-center justify-between p-3 rounded-xl border hover:bg-muted/40 transition-all text-sm font-medium cursor-pointer"
                      >
                        <span>Administradores</span>
                        <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">
                          {admins.length}
                        </span>
                      </button>
                      <button
                        onClick={() => { setSelectedCategory("moderador"); setChatView("category-list"); }}
                        className="w-full flex items-center justify-between p-3 rounded-xl border hover:bg-muted/40 transition-all text-sm font-medium cursor-pointer"
                      >
                        <span>Moderadores</span>
                        <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">
                          {moderators.length}
                        </span>
                      </button>
                      <button
                        onClick={() => { setSelectedCategory("voluntario"); setChatView("category-list"); }}
                        className="w-full flex items-center justify-between p-3 rounded-xl border hover:bg-muted/40 transition-all text-sm font-medium cursor-pointer"
                      >
                        <span>Voluntários</span>
                        <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">
                          {volunteers.length}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {chatView === "category-list" && (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 border-b px-4 py-3 bg-primary text-primary-foreground rounded-t-2xl">
                      <button onClick={() => { setChatView("categories"); setSelectedCategory(null); }} className="cursor-pointer text-xs font-semibold">
                        <span>← Voltar</span>
                      </button>
                      <span className="text-xs font-semibold">|</span>
                      <h3 className="font-semibold text-sm capitalize">
                        {selectedCategory === "administrador" ? "Administradores" : selectedCategory === "moderador" ? "Moderadores" : "Voluntários"}
                      </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-1">
                      {selectedCategory === "administrador" && admins.map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setActiveRecipient(u);
                            startTeamChat.mutate(u.id);
                          }}
                          disabled={startTeamChat.isPending}
                          className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-muted/40 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span className="font-medium">{u.name}</span>
                          <span className={`h-2 w-2 rounded-full transition-colors ${onlineUsers.has(u.id) ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                        </button>
                      ))}
                      {selectedCategory === "moderador" && moderators.map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setActiveRecipient(u);
                            startTeamChat.mutate(u.id);
                          }}
                          disabled={startTeamChat.isPending}
                          className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-muted/40 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span className="font-medium">{u.name}</span>
                          <span className={`h-2 w-2 rounded-full transition-colors ${onlineUsers.has(u.id) ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                        </button>
                      ))}
                      {selectedCategory === "voluntario" && volunteers.map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setActiveRecipient(u);
                            startTeamChat.mutate(u.id);
                          }}
                          disabled={startTeamChat.isPending}
                          className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-muted/40 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span className="font-medium">{u.name}</span>
                          <span className={`h-2 w-2 rounded-full transition-colors ${onlineUsers.has(u.id) ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                        </button>
                      ))}
                      {((selectedCategory === "administrador" && admins.length === 0) ||
                        (selectedCategory === "moderador" && moderators.length === 0) ||
                        (selectedCategory === "voluntario" && volunteers.length === 0)) && (
                        <p className="text-xs text-muted-foreground text-center py-4">Nenhum membro nesta categoria.</p>
                      )}
                    </div>
                  </div>
                )}

                {chatView === "conversation" && (
                  <div className="flex flex-col h-full bg-background">
                    <div className="flex items-center justify-between border-b px-4 py-2.5 bg-primary text-primary-foreground rounded-t-2xl">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setChatView("category-list"); setActiveConversationId(null); setActiveRecipient(null); }} className="cursor-pointer text-xs font-semibold">
                          <span>← Voltar</span>
                        </button>
                        <span className="text-xs opacity-60">|</span>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs leading-none">{activeRecipient?.name}</span>
                          <span className="text-[9px] opacity-80 capitalize mt-0.5">
                            {activeRecipient?.role} · {onlineUsers.has(activeRecipient?.id) ? "online" : "offline"}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => setChatOpen(false)} aria-label="Fechar painel" className="cursor-pointer">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div ref={modalScrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/20 flex flex-col">
                      {modalMessagesQuery.isPending && (
                        <p className="text-[11px] text-muted-foreground text-center py-4">Carregando conversa...</p>
                      )}
                      {(modalMessagesQuery.data ?? []).map((msg: any) => {
                        const isMine = msg.author === "user";
                        return (
                          <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMine ? "ml-auto items-end" : "mr-auto items-start"}`}>
                            <div className={`px-3 py-1.5 rounded-2xl text-[11px] leading-snug break-words ${isMine ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card text-card-foreground border rounded-tl-none shadow-sm"}`}>
                              {msg.text}
                            </div>
                            <span className="text-[8px] text-muted-foreground mt-0.5 px-1">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                      {!modalMessagesQuery.isPending && (modalMessagesQuery.data ?? []).length === 0 && (
                        <p className="text-[10px] text-muted-foreground text-center my-auto">Comece a conversa privada de equipe.</p>
                      )}
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const text = modalMessageText.trim();
                        if (text) {
                          sendModalMessage.mutate(text);
                          setModalMessageText("");
                        }
                      }}
                      className="p-2 border-t bg-card flex gap-2 items-center"
                    >
                      <input
                        type="text"
                        value={modalMessageText}
                        onChange={(e) => setModalMessageText(e.target.value)}
                        placeholder="Mensagem..."
                        className="flex-1 text-xs border rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                      />
                      <button type="submit" className="bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/95">
                        <MessageCircle className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                )}
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
