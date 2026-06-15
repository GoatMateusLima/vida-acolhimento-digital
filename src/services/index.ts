import {
  mockApplications, mockConversations, mockMessages, mockMetrics,
  mockQueue, mockReports, mockUsers, mockVolunteers,
} from "@/mocks/db";
import { cloneDeep, delay } from "@/mocks/handlers";
import type {
  Application, ApplicationStatus, ChatMessage, Conversation, Metrics,
  QueueEntry, Report, ReportStatus, User, Volunteer, VolunteerStatus,
} from "@/types";

// AUTH (mock) ------------------------------------------------------------
export const authService = {
  async login(email: string, _password: string): Promise<User> {
    const user = mockUsers.find((u) => u.email === email) ?? mockUsers[0];
    return delay(cloneDeep(user));
  },
  async signup(data: { name: string; email: string }): Promise<User> {
    return delay({
      id: `u-${Date.now()}`, name: data.name, email: data.email,
      initials: data.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase(),
      role: "usuario", joinedAt: new Date().toISOString(),
    });
  },
  async recover(_email: string): Promise<{ ok: true }> {
    return delay({ ok: true });
  },
};

// USERS ------------------------------------------------------------------
export const userService = {
  async me(): Promise<User> { return delay(cloneDeep(mockUsers[0])); },
  async list(): Promise<User[]> { return delay(cloneDeep(mockUsers)); },
  async updateRole(id: string, role: User["role"]): Promise<User> {
    const u = { ...mockUsers.find((x) => x.id === id)!, role };
    return delay(u);
  },
};

// QUEUE / CHAT -----------------------------------------------------------
export const queueService = {
  async list(): Promise<QueueEntry[]> { return delay(cloneDeep(mockQueue)); },
  async join(): Promise<{ position: number; estimatedWait: number }> {
    return delay({ position: 3, estimatedWait: 4 });
  },
  async cancel(): Promise<{ ok: true }> { return delay({ ok: true }); },
};

export const chatService = {
  async getConversations(): Promise<Conversation[]> { return delay(cloneDeep(mockConversations)); },
  async getConversation(id: string): Promise<Conversation> {
    const c = mockConversations.find((x) => x.id === id);
    if (!c) throw new Error("Conversa não encontrada");
    return delay(cloneDeep(c));
  },
  async getMessages(id: string): Promise<ChatMessage[]> {
    return delay(cloneDeep(mockMessages[id] ?? []));
  },
  async sendMessage(conversationId: string, text: string, author: ChatMessage["author"] = "user"): Promise<ChatMessage> {
    const msg: ChatMessage = {
      id: `m-${Date.now()}`, conversationId, author, text,
      createdAt: new Date().toISOString(), status: "sent",
    };
    return delay(msg, 600);
  },
  async endConversation(_id: string): Promise<{ ok: true }> { return delay({ ok: true }); },
};

// VOLUNTEER --------------------------------------------------------------
export const volunteerService = {
  async list(): Promise<Volunteer[]> { return delay(cloneDeep(mockVolunteers)); },
  async setStatus(_id: string, status: VolunteerStatus): Promise<{ status: VolunteerStatus }> {
    return delay({ status });
  },
  async accept(queueId: string): Promise<{ conversationId: string }> {
    return delay({ conversationId: `c-${queueId}` });
  },
};

// APPLICATIONS -----------------------------------------------------------
export const applicationService = {
  async list(): Promise<Application[]> { return delay(cloneDeep(mockApplications)); },
  async get(id: string): Promise<Application> {
    const a = mockApplications.find((x) => x.id === id);
    if (!a) throw new Error("Candidatura não encontrada");
    return delay(cloneDeep(a));
  },
  async submit(data: Omit<Application, "id" | "status" | "submittedAt">): Promise<Application> {
    return delay({
      ...data, id: `a-${Date.now()}`,
      submittedAt: new Date().toISOString(), status: "pendente",
    });
  },
  async setStatus(id: string, status: ApplicationStatus): Promise<{ id: string; status: ApplicationStatus }> {
    return delay({ id, status });
  },
};

// REPORTS / MODERATION ---------------------------------------------------
export const reportService = {
  async list(): Promise<Report[]> { return delay(cloneDeep(mockReports)); },
  async get(id: string): Promise<Report> {
    const r = mockReports.find((x) => x.id === id);
    if (!r) throw new Error("Denúncia não encontrada");
    return delay(cloneDeep(r));
  },
  async create(data: { reportedAlias: string; reason: string; details: string }): Promise<Report> {
    return delay({
      id: `r-${Date.now()}`, reporterAlias: "Você", ...data,
      status: "pendente", priority: "media",
      createdAt: new Date().toISOString(),
      history: [{ at: new Date().toISOString(), action: "Denúncia registrada", by: "Sistema" }],
    });
  },
  async setStatus(id: string, status: ReportStatus, note: string): Promise<{ ok: true }> {
    void id; void status; void note;
    return delay({ ok: true });
  },
};

// METRICS ----------------------------------------------------------------
export const metricsService = {
  async overview(): Promise<Metrics> { return delay(cloneDeep(mockMetrics)); },
};
