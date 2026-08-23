export type ProfileRole = "usuario" | "voluntario" | "moderador" | "administrador";

export interface User {
  id: string;
  name: string;
  nickname: string;
  initials: string;
  email: string;
  role: ProfileRole;
  joinedAt: string;
  avatarColor?: string;
  availabilityStatus?: VolunteerStatus;
}

export type MessageStatus = "sending" | "sent" | "error";
export type MessageAuthor = "user" | "volunteer" | "system";

export interface ChatMessage {
  id: string;
  conversationId: string;
  author: MessageAuthor;
  text: string;
  createdAt: string;
  status: MessageStatus;
}

export type ConversationStatus = "waiting" | "active" | "ended";

export interface Conversation {
  id: string;
  userAlias: string;
  volunteerAlias?: string;
  status: ConversationStatus;
  startedAt: string;
  endedAt?: string;
  topic: string;
  priority: QueuePriority;
  lastMessage?: string;
}

export type QueuePriority = "normal" | "prioritaria" | "crise";

export interface QueueEntry {
  id: string;
  alias: string;
  topic: string;
  priority: QueuePriority;
  waitingSince: string;
  estimatedWait: number; // minutes
}

export type VolunteerStatus = "online" | "ocupado" | "offline";

export interface Volunteer {
  id: string;
  alias: string;
  initials: string;
  status: VolunteerStatus;
  rating: number;
  totalSessions: number;
  applicationStatus: ApplicationStatus;
}

export type ApplicationStatus = "pendente" | "em_analise" | "aprovado" | "recusado";

export interface Application {
  id: string;
  candidateAlias: string;
  submittedAt: string;
  motivation: string;
  availability: string;
  experience: string;
  status: ApplicationStatus;
}

export type ReportStatus = "pendente" | "em_analise" | "resolvido" | "arquivado";

export interface Report {
  id: string;
  reporterAlias: string;
  reportedAlias: string;
  reason: string;
  details: string;
  status: ReportStatus;
  priority: "baixa" | "media" | "alta";
  createdAt: string;
  history: Array<{ at: string; action: string; by: string }>;
}

export interface Metrics {
  totalUsers: number;
  totalVolunteers: number;
  activeConversations: number;
  conversationsToday: number;
  avgWaitMinutes: number;
  satisfactionRate: number;
  weekly: Array<{ day: string; conversations: number }>;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  topic: string;
  memberCount: number;
  onlineCount: number;
  joined: boolean;
  myAlias?: string;
  rules: string[];
}

export interface CommunityMessage {
  id: string;
  communityId: string;
  alias: string;
  text: string;
  createdAt: string;
  isMine?: boolean;
  reported?: boolean;
}

export interface CommunityIdentity {
  messageId: string;
  alias: string;
  realName: string;
  email: string;
  reason: string;
  revealedAt: string;
}

export type AdminCommunityStatus = "ativo" | "pausado" | "arquivado";

export interface AdminCommunity extends Community {
  status: AdminCommunityStatus;
  messageCount: number;
  createdAt: string;
}

export interface AdminCommunityMember {
  userId: string;
  name: string;
  email: string;
  alias: string;
  role: ProfileRole;
  status: "ativo" | "removido";
  joinedAt: string;
  messageCount: number;
}

export interface AdminCommunityDetail extends AdminCommunity {
  members: AdminCommunityMember[];
  messages: CommunityMessage[];
}
