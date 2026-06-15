import {
  mockApplications,
  mockAdminCommunities,
  mockAdminCommunityMembers,
  mockCommunities,
  mockCommunityMessages,
  mockConversations,
  mockMessages,
  mockMetrics,
  mockQueue,
  mockReports,
  mockUsers,
  mockVolunteers,
} from "@/mocks/db";
import { cloneDeep, delay } from "@/mocks/handlers";
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

// AUTH (mock) ------------------------------------------------------------
export const authService = {
  async login(email: string, _password: string): Promise<User> {
    const user = mockUsers.find((u) => u.email === email) ?? mockUsers[0];
    return delay(cloneDeep(user));
  },
  async signup(data: { name: string; email: string }): Promise<User> {
    return delay({
      id: `u-${Date.now()}`,
      name: data.name,
      email: data.email,
      initials: data.name
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
      role: "usuario",
      joinedAt: new Date().toISOString(),
    });
  },
  async continueAnonymously(): Promise<User> {
    return delay({
      id: `anonymous-${Date.now()}`,
      name: "Pessoa anônima",
      email: "",
      initials: "A",
      role: "usuario",
      joinedAt: new Date().toISOString(),
    });
  },
  async recover(_email: string): Promise<{ ok: true }> {
    return delay({ ok: true });
  },
};

// USERS ------------------------------------------------------------------
export const userService = {
  async me(): Promise<User> {
    return delay(cloneDeep(mockUsers[0]));
  },
  async list(): Promise<User[]> {
    return delay(cloneDeep(mockUsers));
  },
  async updateRole(id: string, role: User["role"]): Promise<User> {
    const u = { ...mockUsers.find((x) => x.id === id)!, role };
    return delay(u);
  },
};

// QUEUE / CHAT -----------------------------------------------------------
export const queueService = {
  async list(): Promise<QueueEntry[]> {
    return delay(cloneDeep(mockQueue));
  },
  async join(): Promise<{ position: number; estimatedWait: number }> {
    return delay({ position: 3, estimatedWait: 4 });
  },
  async cancel(): Promise<{ ok: true }> {
    return delay({ ok: true });
  },
};

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    return delay(cloneDeep(mockConversations));
  },
  async getConversation(id: string): Promise<Conversation> {
    const c = mockConversations.find((x) => x.id === id);
    if (!c) throw new Error("Conversa não encontrada");
    return delay(cloneDeep(c));
  },
  async getMessages(id: string): Promise<ChatMessage[]> {
    return delay(cloneDeep(mockMessages[id] ?? []));
  },
  async sendMessage(
    conversationId: string,
    text: string,
    author: ChatMessage["author"] = "user",
  ): Promise<ChatMessage> {
    const msg: ChatMessage = {
      id: `m-${Date.now()}`,
      conversationId,
      author,
      text,
      createdAt: new Date().toISOString(),
      status: "sent",
    };
    return delay(msg, 600);
  },
  async endConversation(_id: string): Promise<{ ok: true }> {
    return delay({ ok: true });
  },
};

// VOLUNTEER --------------------------------------------------------------
export const volunteerService = {
  async list(): Promise<Volunteer[]> {
    return delay(cloneDeep(mockVolunteers));
  },
  async setStatus(_id: string, status: VolunteerStatus): Promise<{ status: VolunteerStatus }> {
    return delay({ status });
  },
  async accept(queueId: string): Promise<{ conversationId: string }> {
    return delay({ conversationId: `c-${queueId}` });
  },
};

// APPLICATIONS -----------------------------------------------------------
export const applicationService = {
  async list(): Promise<Application[]> {
    return delay(cloneDeep(mockApplications));
  },
  async get(id: string): Promise<Application> {
    const a = mockApplications.find((x) => x.id === id);
    if (!a) throw new Error("Candidatura não encontrada");
    return delay(cloneDeep(a));
  },
  async submit(data: Omit<Application, "id" | "status" | "submittedAt">): Promise<Application> {
    return delay({
      ...data,
      id: `a-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: "pendente",
    });
  },
  async setStatus(
    id: string,
    status: ApplicationStatus,
  ): Promise<{ id: string; status: ApplicationStatus }> {
    return delay({ id, status });
  },
};

// REPORTS / MODERATION ---------------------------------------------------
export const reportService = {
  async list(): Promise<Report[]> {
    return delay(cloneDeep(mockReports));
  },
  async get(id: string): Promise<Report> {
    const r = mockReports.find((x) => x.id === id);
    if (!r) throw new Error("Denúncia não encontrada");
    return delay(cloneDeep(r));
  },
  async create(data: { reportedAlias: string; reason: string; details: string }): Promise<Report> {
    return delay({
      id: `r-${Date.now()}`,
      reporterAlias: "Você",
      ...data,
      status: "pendente",
      priority: "media",
      createdAt: new Date().toISOString(),
      history: [{ at: new Date().toISOString(), action: "Denúncia registrada", by: "Sistema" }],
    });
  },
  async setStatus(id: string, status: ReportStatus, note: string): Promise<{ ok: true }> {
    void id;
    void status;
    void note;
    return delay({ ok: true });
  },
};

// PSEUDONYMOUS COMMUNITIES ----------------------------------------------
export const communityService = {
  async list(): Promise<Community[]> {
    return delay(cloneDeep(mockCommunities));
  },
  async get(id: string): Promise<Community> {
    const community = mockCommunities.find((item) => item.id === id);
    if (!community) throw new Error("Grupo não encontrado");
    return delay(cloneDeep(community));
  },
  async join(id: string): Promise<Community> {
    const community = mockCommunities.find((item) => item.id === id);
    if (!community) throw new Error("Grupo não encontrado");
    community.joined = true;
    community.memberCount += 1;
    community.myAlias ??= `Aurora Serena ${Math.floor(Math.random() * 90 + 10)}`;
    return delay(cloneDeep(community));
  },
  async leave(id: string): Promise<{ ok: true }> {
    const community = mockCommunities.find((item) => item.id === id);
    if (community?.joined) {
      community.joined = false;
      community.memberCount = Math.max(0, community.memberCount - 1);
    }
    return delay({ ok: true });
  },
  async getMessages(id: string): Promise<CommunityMessage[]> {
    return delay(cloneDeep(mockCommunityMessages[id] ?? []));
  },
  async sendMessage(id: string, text: string): Promise<CommunityMessage> {
    const community = mockCommunities.find((item) => item.id === id);
    if (!community?.joined || !community.myAlias) throw new Error("Entre no grupo para conversar");
    const message: CommunityMessage = {
      id: `gm-${Date.now()}`,
      communityId: id,
      alias: community.myAlias,
      text,
      createdAt: new Date().toISOString(),
      isMine: true,
    };
    mockCommunityMessages[id] = [...(mockCommunityMessages[id] ?? []), message];
    return delay(cloneDeep(message), 350);
  },
  async revealIdentity(messageId: string, reason: string): Promise<CommunityIdentity> {
    const message = Object.values(mockCommunityMessages)
      .flat()
      .find((item) => item.id === messageId);
    if (!message?.reported)
      throw new Error("A identidade só pode ser consultada em um caso denunciado");
    if (reason.trim().length < 10)
      throw new Error("Informe uma justificativa com pelo menos 10 caracteres");
    return delay({
      messageId,
      alias: message.alias,
      realName: "Pessoa protegida (exemplo)",
      email: "conta.protegida@exemplo.com",
      reason: reason.trim(),
      revealedAt: new Date().toISOString(),
    });
  },
};

export const adminCommunityService = {
  async list(): Promise<AdminCommunity[]> {
    return delay(cloneDeep(mockAdminCommunities));
  },
  async get(id: string): Promise<AdminCommunityDetail> {
    const community = mockAdminCommunities.find((item) => item.id === id);
    if (!community) throw new Error("Grupo não encontrado");
    return delay({
      ...cloneDeep(community),
      members: cloneDeep(mockAdminCommunityMembers[id] ?? []),
      messages: cloneDeep(mockCommunityMessages[id] ?? []),
    });
  },
  async create(input: { name: string; description: string }): Promise<AdminCommunity> {
    const community: AdminCommunity = {
      id: `g-${Date.now()}`,
      name: input.name,
      description: input.description,
      topic: "Novo grupo",
      memberCount: 0,
      onlineCount: 0,
      joined: false,
      rules: [],
      status: "ativo",
      messageCount: 0,
      createdAt: new Date().toISOString(),
    };
    mockAdminCommunities.unshift(community);
    mockAdminCommunityMembers[community.id] = [];
    mockCommunityMessages[community.id] = [];
    return delay(cloneDeep(community));
  },
  async updateStatus(id: string, status: AdminCommunityStatus): Promise<AdminCommunity> {
    const community = mockAdminCommunities.find((item) => item.id === id);
    if (!community) throw new Error("Grupo não encontrado");
    community.status = status;
    return delay(cloneDeep(community));
  },
  async update(id: string, input: { name: string; description: string }): Promise<AdminCommunity> {
    const community = mockAdminCommunities.find((item) => item.id === id);
    if (!community) throw new Error("Grupo não encontrado");
    community.name = input.name;
    community.description = input.description;
    return delay(cloneDeep(community));
  },
  async updateMember(
    communityId: string,
    userId: string,
    status: "ativo" | "removido",
  ): Promise<{ ok: true }> {
    const member = mockAdminCommunityMembers[communityId]?.find((item) => item.userId === userId);
    if (!member) throw new Error("Participante não encontrado");
    member.status = status;
    return delay({ ok: true });
  },
  async deleteMessage(communityId: string, messageId: string): Promise<{ ok: true }> {
    mockCommunityMessages[communityId] = (mockCommunityMessages[communityId] ?? []).filter(
      (message) => message.id !== messageId,
    );
    const community = mockAdminCommunities.find((item) => item.id === communityId);
    if (community) community.messageCount = Math.max(0, community.messageCount - 1);
    return delay({ ok: true });
  },
};

// METRICS ----------------------------------------------------------------
export const metricsService = {
  async overview(): Promise<Metrics> {
    return delay(cloneDeep(mockMetrics));
  },
};
