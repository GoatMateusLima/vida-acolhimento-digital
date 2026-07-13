/* eslint-disable @typescript-eslint/no-explicit-any */
import { http, setAccessToken, setRefreshToken } from "@/services/api/client";
import type {
  Application,
  AdminCommunity,
  AdminCommunityDetail,
  AdminCommunityStatus,
  ApplicationStatus,
  ChatMessage,
  Community,
  CommunityIdentity,
  CommunityMessage,
  Conversation,
  Metrics,
  QueueEntry,
  Report,
  ReportStatus,
  User,
  Volunteer,
  VolunteerStatus,
} from "@/types";

type ApiEnvelope<T> = {
  status: string;
  message?: string;
  data: T;
};

type BackendRole = "anonimo" | "cadastrado" | "voluntario" | "moderador" | "administrador";

const CURRENT_USER_KEY = "vidaplus:user_id";

async function apiData<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await http<ApiEnvelope<T>>(path, init);
  return response.data;
}

function saveCurrentUserId(id?: string) {
  if (typeof window === "undefined" || !id) return;
  window.localStorage.setItem(CURRENT_USER_KEY, id);
}

function getCurrentUserId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CURRENT_USER_KEY);
}

function mapRole(role?: BackendRole): User["role"] {
  if (role === "voluntario" || role === "moderador" || role === "administrador") return role;
  return "usuario";
}

function toBackendRole(role: User["role"]): Exclude<BackendRole, "anonimo"> {
  if (role === "usuario") return "cadastrado";
  return role;
}

function initialsFrom(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function mapUser(input: any, emailFallback = ""): User {
  const name =
    input?.display_name ??
    input?.user_metadata?.display_name ??
    input?.profile?.nickname ??
    input?.email ??
    "Pessoa VIDA+";
  const id = input?.id ?? input?.user_id ?? "me";
  return {
    id,
    name,
    initials: initialsFrom(name),
    email: input?.email ?? emailFallback,
    role: mapRole(input?.role ?? input?.app_metadata?.role),
    joinedAt: input?.created_at ?? input?.created_at ?? new Date().toISOString(),
  };
}

function mapVolunteer(input: any): Volunteer {
  // backend retorna display_name direto no objeto (GET /admin/volunteers)
  const name = input.users?.display_name ?? input.display_name ?? "Voluntario";
  return {
    id: input.user_id ?? input.id,
    alias: name,
    initials: initialsFrom(name),
    // backend retorna "status" em GET /admin/volunteers, "availability_status" em outros contextos
    status: input.status ?? input.availability_status ?? "offline",
    rating: input.rating ?? 0,
    totalSessions: input.total_chats ?? input.totalSessions ?? 0,
    applicationStatus: "aprovado",
  };
}

function mapConversationStatus(status?: string): Conversation["status"] {
  if (status === "ativa" || status === "sinalizada") return "active";
  if (status === "encerrada" || status === "arquivada") return "ended";
  return "waiting";
}

function mapConversation(input: any): Conversation {
  return {
    id: input.id,
    // volunteer_display_name é o campo novo que o backend vai adicionar (gap #3)
    // fallback: usa volunteer_id presente → "Voluntário" genérico
    userAlias: input.anonymous_name ?? "Pessoa acolhida",
    volunteerAlias: input.volunteer_display_name ?? (input.volunteer_id ? "Voluntário" : undefined),
    status: mapConversationStatus(input.status),
    startedAt: input.started_at ?? input.created_at ?? new Date().toISOString(),
    endedAt: input.ended_at,
    topic: input.closed_reason ?? "Atendimento emocional",
    priority: input.priority ?? "normal",
    lastMessage: input.last_message,
  };
}

function mapMessage(input: any): ChatMessage {
  const mine = input.sender_id && input.sender_id === getCurrentUserId();
  // backend usa body_encrypted (já descriptografado pelo backend antes de enviar)
  // type "system" ou sender_id nulo indica mensagem de sistema
  const isSystem = input.type === "system" || input.sender_id == null;
  return {
    id: input.id,
    conversationId: input.conversation_id,
    author: isSystem ? "system" : mine ? "user" : "volunteer",
    text: input.body_encrypted ?? input.body ?? input.text ?? "",
    createdAt: input.created_at ?? new Date().toISOString(),
    status: "sent",
  };
}

function mapQueueEntry(input: any): QueueEntry {
  const waitingSince = input.created_at ?? new Date().toISOString();
  const waitedMinutes = Math.max(
    1,
    Math.round((Date.now() - new Date(waitingSince).getTime()) / 60000),
  );
  return {
    id: input.id,
    alias: input.anonymous_name ?? "Pessoa aguardando",
    topic: "Acolhimento emocional",
    priority: input.priority ?? "normal",
    waitingSince,
    estimatedWait: Math.max(1, 5 - waitedMinutes),
  };
}

function mapApplicationStatus(status?: string): ApplicationStatus {
  if (status === "aprovada") return "aprovado";
  if (status === "rejeitada") return "recusado";
  if (status === "em_analise") return "em_analise";
  return "pendente";
}

function toBackendApplicationStatus(status: ApplicationStatus) {
  if (status === "aprovado") return "aprovada";
  if (status === "recusado") return "rejeitada";
  return status;
}

function mapApplication(input: any): Application {
  const name = input.users?.display_name ?? input.candidateAlias ?? "Candidato";
  return {
    id: input.id,
    candidateAlias: name,
    submittedAt: input.created_at ?? input.submittedAt ?? new Date().toISOString(),
    motivation: input.motivation ?? "",
    availability: input.availability ?? "A combinar",
    experience: input.experience ?? "",
    status: mapApplicationStatus(input.status),
  };
}

function mapReport(input: any): Report {
  return {
    id: input.id,
    reporterAlias: input.reporterAlias ?? "Pessoa denunciante",
    reportedAlias: input.target_id ?? input.reportedAlias ?? "Alvo informado",
    reason: input.reason ?? "",
    details: input.description ?? input.details ?? "",
    status: input.status ?? "pendente",
    priority: input.priority ?? "media",
    createdAt: input.created_at ?? input.createdAt ?? new Date().toISOString(),
    history: input.history ?? [],
  };
}

function mapCommunity(input: any): Community {
  return {
    id: input.id,
    name: input.name,
    description: input.description ?? "",
    topic: input.topic ?? input.name,
    memberCount: input.member_count ?? input.memberCount ?? 0,
    onlineCount: input.online_count ?? input.onlineCount ?? 0,
    // backend retorna is_member (não joined)
    joined: Boolean(input.joined ?? input.is_member),
    myAlias: input.my_alias ?? input.myAlias,
    rules: input.rules_json ?? input.rules ?? [],
  };
}

function mapAdminCommunity(input: any): AdminCommunity {
  return {
    ...mapCommunity(input),
    status: input.status ?? "ativo",
    messageCount: input.message_count ?? input.messageCount ?? 0,
    createdAt: input.created_at ?? input.createdAt ?? new Date().toISOString(),
  };
}

function mapCommunityMessage(input: any): CommunityMessage {
  return {
    id: input.id,
    communityId: input.community_id,
    alias: input.alias ?? input.alias_snapshot ?? "Participante",
    // aceita body_encrypted (consistência com chat) ou body/text
    text: input.body_encrypted ?? input.body ?? input.text ?? "",
    createdAt: input.created_at ?? new Date().toISOString(),
    isMine: input.is_mine ?? input.isMine,
    reported: input.reported,
  };
}

async function loginWithSession(data: any, emailFallback = ""): Promise<User> {
  const token = data.session?.access_token;
  const refreshToken = data.session?.refresh_token;
  setAccessToken(token ?? null);
  setRefreshToken(refreshToken ?? null);
  const authUser = data.user ? mapUser(data.user, emailFallback) : null;
  saveCurrentUserId(authUser?.id);
  try {
    const me = await apiData<any>("/users/me");
    const user = mapUser(me, authUser?.email ?? emailFallback);
    saveCurrentUserId(user.id);
    return user;
  } catch {
    if (authUser) return authUser;
    throw new Error("Nao foi possivel carregar o perfil.");
  }
}

// AUTH ------------------------------------------------------------------
export const authService = {
  async login(email: string, password: string): Promise<User> {
    const data = await apiData<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return loginWithSession(data, email);
  },
  async signup(data: { name: string; email: string; password: string }): Promise<User> {
    const registered = await apiData<any>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        displayName: data.name,
        email: data.email,
        password: data.password,
      }),
    });
    if (registered.session?.access_token) return loginWithSession(registered, data.email);
    return authService.login(data.email, data.password);
  },
  async continueAnonymously(): Promise<User> {
    const data = await apiData<any>("/auth/anonymous", { method: "POST" });
    return loginWithSession(data);
  },
  async recover(email: string): Promise<{ ok: true }> {
    await apiData<unknown>("/auth/password/reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return { ok: true };
  },
};

// USERS -----------------------------------------------------------------
export const userService = {
  async me(): Promise<User> {
    const data = await apiData<any>("/users/me");
    const user = mapUser(data);
    saveCurrentUserId(user.id);
    return user;
  },
  async list(): Promise<User[]> {
    const data = await apiData<any[]>("/users/admin");
    return data.map((u) => mapUser(u));
  },
  async updateRole(id: string, role: User["role"]): Promise<User> {
    const data = await apiData<any>(`/users/admin/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role: toBackendRole(role) }),
    });
    return mapUser(data);
  },
};

// QUEUE / CHAT ----------------------------------------------------------
export const queueService = {
  async list(): Promise<QueueEntry[]> {
    const data = await apiData<any[]>("/conversations/volunteer/queue");
    return data.map(mapQueueEntry);
  },
  async join(): Promise<{ position: number; estimatedWait: number; conversationId: string }> {
    const data = await apiData<any>("/conversations", { method: "POST" });
    // position e estimated_wait_minutes são retornados quando backend implementar gap #2
    // fallback: position=1, estimatedWait=4 enquanto o backend não os envia
    return {
      position: data.position ?? 1,
      estimatedWait: data.estimated_wait_minutes ?? data.estimatedWait ?? 4,
      conversationId: data.id,
    };
  },
  async cancel(): Promise<{ ok: true }> {
    return { ok: true };
  },
};

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    // backend retorna array direto em data (não { items: [] })
    const data = await apiData<any>("/conversations");
    const list: any[] = Array.isArray(data) ? data : (data.items ?? []);
    return list.map(mapConversation);
  },
  async getConversation(id: string): Promise<Conversation> {
    const data = await apiData<any>(`/conversations/${id}`);
    return mapConversation(data);
  },
  async getMessages(id: string): Promise<ChatMessage[]> {
    const data = await apiData<any>(`/conversations/${id}`);
    // backend retorna mensagens dentro do objeto da conversa
    return (data.messages ?? []).map(mapMessage);
  },
  async sendMessage(
    conversationId: string,
    text: string,
    _author: ChatMessage["author"] = "user",
  ): Promise<ChatMessage> {
    const data = await apiData<any>(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    return mapMessage(data);
  },
  async endConversation(id: string): Promise<{ ok: true }> {
    await apiData<unknown>(`/conversations/${id}/close`, {
      method: "POST",
      body: JSON.stringify({ reason: "usuario_encerrou" }),
    });
    return { ok: true };
  },
};

// VOLUNTEER -------------------------------------------------------------
export const volunteerService = {
  async list(): Promise<Volunteer[]> {
    const data = await apiData<any[]>("/admin/volunteers");
    return data.map(mapVolunteer);
  },
  async setStatus(_id: string, status: VolunteerStatus): Promise<{ status: VolunteerStatus }> {
    await apiData<unknown>("/admin/volunteers/availability", {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return { status };
  },
  async accept(queueId: string): Promise<{ conversationId: string }> {
    const data = await apiData<any>(`/conversations/${queueId}/accept`, { method: "POST" });
    return { conversationId: data.id };
  },
};

// APPLICATIONS ----------------------------------------------------------
export const applicationService = {
  async list(): Promise<Application[]> {
    const data = await apiData<any[]>("/admin/volunteers/applications");
    return data.map(mapApplication);
  },
  async get(id: string): Promise<Application> {
    const data = await apiData<any>(`/admin/volunteers/applications/${id}`);
    return mapApplication(data);
  },
  async submit(data: Omit<Application, "id" | "status" | "submittedAt">): Promise<Application> {
    const response = await apiData<any>("/admin/volunteers/apply", {
      method: "POST",
      body: JSON.stringify({
        motivation: data.motivation,
        experience: `${data.experience}\nDisponibilidade: ${data.availability}`,
      }),
    });
    return mapApplication({ ...response, candidateAlias: data.candidateAlias });
  },
  async setStatus(
    id: string,
    status: ApplicationStatus,
  ): Promise<{ id: string; status: ApplicationStatus }> {
    const backendStatus = toBackendApplicationStatus(status);
    if (backendStatus !== "aprovada") {
      await apiData<unknown>(`/admin/volunteers/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ decision: "Candidatura rejeitada pela administracao." }),
      });
      return { id, status };
    }
    await apiData<unknown>(`/admin/volunteers/${id}/approve`, { method: "POST" });
    return { id, status };
  },
};

// REPORTS / MODERATION --------------------------------------------------

// Cache local de denúncias enviadas — persiste enquanto o backend não tem GET /reports/my
const MY_REPORTS_KEY = "vida:my-reports";

function loadLocalReports(): Report[] {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(MY_REPORTS_KEY) : null;
    return raw ? (JSON.parse(raw) as Report[]) : [];
  } catch {
    return [];
  }
}

function saveLocalReport(report: Report) {
  if (typeof window === "undefined") return;
  const existing = loadLocalReports();
  // evita duplicata pelo id
  const updated = [report, ...existing.filter((r) => r.id !== report.id)];
  // mantém máximo de 50 denúncias locais
  window.localStorage.setItem(MY_REPORTS_KEY, JSON.stringify(updated.slice(0, 50)));
}

function mergeReports(local: Report[], remote: Report[]): Report[] {
  if (remote.length === 0) return local;
  // quando o backend responder, preferir dados remotos (mais atualizados)
  // mas manter locais que ainda não aparecem no backend
  const remoteIds = new Set(remote.map((r) => r.id));
  const onlyLocal = local.filter((r) => !remoteIds.has(r.id));
  return [...remote, ...onlyLocal].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export const reportService = {
  async list(): Promise<Report[]> {
    const data = await apiData<any[]>("/reports/admin/reports");
    return data.map(mapReport);
  },
  async get(id: string): Promise<Report> {
    const data = await apiData<any>(`/reports/admin/reports/${id}`);
    return mapReport(data);
  },
  /** Denúncias feitas pelo usuário logado.
   * Tenta buscar do backend (GET /reports/my) e mescla com cache local.
   * Se o backend ainda não tem o endpoint, retorna apenas o cache local.
   */
  async listMine(): Promise<Report[]> {
    const local = loadLocalReports();
    try {
      const data = await apiData<any>("/reports/my");
      const list: any[] = Array.isArray(data) ? data : (data.items ?? []);
      const remote = list.map(mapReport);
      return mergeReports(local, remote);
    } catch {
      // backend ainda não implementou — retorna cache local
      return local;
    }
  },
  async create(data: { reportedAlias: string; reason: string; details: string }): Promise<Report> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        data.reportedAlias,
      );
    const response = await apiData<any>("/reports", {
      method: "POST",
      body: JSON.stringify(
        isUuid
          ? {
              targetType: "usuario",
              targetId: data.reportedAlias,
              reason: data.reason,
              description: data.details,
            }
          : {
              targetType: "usuario",
              reportedAlias: data.reportedAlias,
              reason: data.reason,
              description: data.details,
            },
      ),
    });
    const report = mapReport(response);
    // salva localmente para garantir que o usuário veja mesmo sem GET /reports/my
    saveLocalReport(report);
    return report;
  },
  async setStatus(id: string, status: ReportStatus, note: string): Promise<{ ok: true }> {
    await apiData<unknown>(`/reports/admin/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, decision: note || "Atualizado pela moderacao." }),
    });
    // atualiza o status no cache local para o usuário que enviou ver a mudança
    if (typeof window !== "undefined") {
      const local = loadLocalReports();
      const updated = local.map((r) => (r.id === id ? { ...r, status } : r));
      window.localStorage.setItem(MY_REPORTS_KEY, JSON.stringify(updated));
    }
    return { ok: true };
  },
};

// PSEUDONYMOUS COMMUNITIES ---------------------------------------------
export const communityService = {
  async list(): Promise<Community[]> {
    const data = await apiData<any[]>("/communities");
    return data.map(mapCommunity);
  },
  async get(id: string): Promise<Community> {
    const communities = await communityService.list();
    const community = communities.find((item) => item.id === id);
    if (!community) throw new Error("Grupo nao encontrado");
    return community;
  },
  async join(id: string): Promise<Community> {
    await apiData<unknown>(`/communities/${id}/join`, { method: "POST" });
    return communityService.get(id);
  },
  async leave(id: string): Promise<{ ok: true }> {
    await apiData<unknown>(`/communities/${id}/leave`, { method: "POST" });
    return { ok: true };
  },
  async getMessages(id: string): Promise<CommunityMessage[]> {
    // backend retorna array direto em data (não { items: [] })
    const data = await apiData<any>(`/communities/${id}/messages`);
    const list: any[] = Array.isArray(data) ? data : (data.items ?? []);
    return list.map(mapCommunityMessage);
  },
  async sendMessage(id: string, text: string): Promise<CommunityMessage> {
    const data = await apiData<any>(`/communities/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    return mapCommunityMessage(data);
  },
  async revealIdentity(messageId: string, reason: string): Promise<CommunityIdentity> {
    const data = await apiData<any>(`/communities/messages/${messageId}/reveal-identity`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    // backend gap #9: espera { message_id, alias, display_name, email }
    // fallback: aceita { real_user_id, display_name } que é o que o backend documenta hoje
    return {
      messageId: data.message_id ?? messageId,
      alias: data.alias ?? data.alias_snapshot ?? "—",
      realName: data.display_name ?? data.real_name ?? "",
      email: data.email ?? "",
      reason,
      revealedAt: new Date().toISOString(),
    };
  },
};

export const adminCommunityService = {
  async list(): Promise<AdminCommunity[]> {
    const data = await apiData<any[]>("/communities/admin");
    return data.map(mapAdminCommunity);
  },
  async get(id: string): Promise<AdminCommunityDetail> {
    const data = await apiData<any>(`/communities/admin/${id}`);
    const community = mapAdminCommunity(data);
    return {
      ...community,
      members: (data.members ?? []).map((member: any) => ({
        userId: member.user_id ?? member.userId,
        name: member.display_name ?? member.name ?? "Participante",
        email: member.email ?? "",
        alias: member.alias ?? "",
        role: mapRole(member.platform_role ?? member.role),
        status: member.status ?? "ativo",
        joinedAt: member.joined_at ?? member.joinedAt ?? new Date().toISOString(),
        messageCount: member.messageCount ?? 0,
      })),
      messages: (data.messages ?? []).map(mapCommunityMessage),
    };
  },
  async create(input: { name: string; description: string }): Promise<AdminCommunity> {
    const data = await apiData<any>("/communities/admin", {
      method: "POST",
      body: JSON.stringify({ ...input, rules: [] }),
    });
    return mapAdminCommunity(data);
  },
  async updateStatus(id: string, status: AdminCommunityStatus): Promise<AdminCommunity> {
    const data = await apiData<any>(`/communities/admin/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return mapAdminCommunity(data);
  },
  async update(id: string, input: { name: string; description: string }): Promise<AdminCommunity> {
    const data = await apiData<any>(`/communities/admin/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return mapAdminCommunity(data);
  },
  async updateMember(
    communityId: string,
    userId: string,
    status: "ativo" | "removido",
  ): Promise<{ ok: true }> {
    await apiData<unknown>(`/communities/admin/${communityId}/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return { ok: true };
  },
  async deleteMessage(_communityId: string, messageId: string): Promise<{ ok: true }> {
    await apiData<unknown>(`/communities/admin/messages/${messageId}`, {
      method: "DELETE",
      body: JSON.stringify({ reason: "Removido pela moderacao do VIDA+." }),
    });
    return { ok: true };
  },
};

// NOTIFICATIONS ---------------------------------------------------------
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

function mapNotification(input: any): Notification {
  return {
    id: input.id,
    userId: input.user_id ?? input.userId ?? "",
    title: input.title ?? "",
    body: input.body ?? "",
    readAt: input.read_at ?? input.readAt ?? null,
    createdAt: input.created_at ?? input.createdAt ?? new Date().toISOString(),
  };
}

export const notificationService = {
  async list(): Promise<Notification[]> {
    const data = await apiData<any>("/notifications");
    const list: any[] = Array.isArray(data) ? data : (data.items ?? []);
    return list.map(mapNotification);
  },
  async markRead(id: string): Promise<{ ok: true }> {
    await apiData<unknown>(`/notifications/${id}/read`, { method: "PATCH" });
    return { ok: true };
  },
};

// METRICS ---------------------------------------------------------------
export const metricsService = {
  async overview(): Promise<Metrics> {
    // backend retorna { total, ativas, encerradas } + campos extras quando implementar gap #4
    const data = await apiData<any>("/conversations/volunteer/dashboard");
    return {
      totalUsers: data.totalUsersAllTime ?? data.total_users ?? 0,
      totalVolunteers: data.onlineVolunteers ?? data.online_volunteers ?? 0,
      activeConversations: data.ativas ?? data.active_chats ?? data.activeChats ?? 0,
      conversationsToday: data.total ?? data.ativas ?? 0,
      avgWaitMinutes: (data.pendingChats ?? data.pending_chats) ? 5 : 0,
      satisfactionRate: data.satisfactionRate ?? data.satisfaction_rate ?? 0,
      weekly: (data.weeklyConversations ?? data.weekly_conversations ?? []).map((w: any) => ({
        day: w.day,
        conversations: w.conversations ?? w.count ?? 0,
      })),
    };
  },
};
