import type {
  Application,
  ChatMessage,
  Community,
  CommunityMessage,
  Conversation,
  Metrics,
  QueueEntry,
  Report,
  User,
  Volunteer,
} from "@/types";

export const mockUsers: User[] = [
  {
    id: "u1",
    name: "Ana Beatriz",
    initials: "AB",
    email: "ana@exemplo.com",
    role: "usuario",
    joinedAt: "2025-01-12",
  },
  {
    id: "u2",
    name: "Carlos Mendes",
    initials: "CM",
    email: "carlos@exemplo.com",
    role: "voluntario",
    joinedAt: "2024-06-03",
  },
  {
    id: "u3",
    name: "Marina Souza",
    initials: "MS",
    email: "marina@exemplo.com",
    role: "moderador",
    joinedAt: "2024-02-20",
  },
  {
    id: "u4",
    name: "Rafael Lima",
    initials: "RL",
    email: "rafael@exemplo.com",
    role: "administrador",
    joinedAt: "2023-11-05",
  },
];

export const mockConversations: Conversation[] = [
  {
    id: "c1",
    userAlias: "Usuário A.",
    volunteerAlias: "Voluntário C.",
    status: "ended",
    startedAt: "2026-06-10T14:20:00Z",
    endedAt: "2026-06-10T15:02:00Z",
    topic: "Ansiedade",
    priority: "normal",
    lastMessage: "Obrigada por escutar.",
  },
  {
    id: "c2",
    userAlias: "Usuário A.",
    volunteerAlias: "Voluntário M.",
    status: "ended",
    startedAt: "2026-06-05T20:00:00Z",
    endedAt: "2026-06-05T20:48:00Z",
    topic: "Solidão",
    priority: "normal",
    lastMessage: "Foi bom conversar.",
  },
  {
    id: "c3",
    userAlias: "Usuário A.",
    status: "waiting",
    startedAt: new Date().toISOString(),
    topic: "Conversa geral",
    priority: "normal",
  },
];

const nowISO = () => new Date().toISOString();
const minusMin = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

export const mockCommunities: Community[] = [
  {
    id: "g1",
    name: "Conversas leves",
    description: "Um espaço acolhedor para conversar sobre o dia, pequenas vitórias e companhia.",
    topic: "Convivência",
    memberCount: 148,
    onlineCount: 12,
    joined: true,
    myAlias: "Girassol Calmo 27",
    rules: [
      "Respeite o tempo e a história de cada pessoa.",
      "Não compartilhe contatos ou dados pessoais.",
      "Não faça diagnósticos nem substitua ajuda profissional.",
    ],
  },
  {
    id: "g2",
    name: "Ansiedade e rotina",
    description: "Trocas sobre ansiedade, autocuidado e formas gentis de atravessar dias difíceis.",
    topic: "Bem-estar",
    memberCount: 231,
    onlineCount: 19,
    joined: false,
    rules: [
      "Acolha sem julgar ou pressionar.",
      "Evite recomendações médicas.",
      "Denuncie mensagens que causem risco ou desconforto.",
    ],
  },
  {
    id: "g3",
    name: "Luto e saudade",
    description: "Um grupo cuidadoso para falar sobre perdas, lembranças e saudade.",
    topic: "Acolhimento",
    memberCount: 84,
    onlineCount: 6,
    joined: false,
    rules: [
      "Não compare dores ou apresse processos.",
      "Preserve a privacidade de todos.",
      "Use linguagem sensível e respeitosa.",
    ],
  },
];

export const mockCommunityMessages: Record<string, CommunityMessage[]> = {
  g1: [
    {
      id: "gm1",
      communityId: "g1",
      alias: "Nuvem Serena 14",
      text: "Hoje consegui sair para caminhar um pouco. Foi simples, mas me fez bem.",
      createdAt: minusMin(18),
    },
    {
      id: "gm2",
      communityId: "g1",
      alias: "Lua Gentil 08",
      text: "Que bom ler isso. Às vezes essas pequenas pausas mudam o ritmo do dia.",
      createdAt: minusMin(14),
    },
    {
      id: "gm3",
      communityId: "g1",
      alias: "Girassol Calmo 27",
      text: "Estou chegando agora. Obrigada por existir um lugar assim.",
      createdAt: minusMin(6),
      isMine: true,
    },
  ],
  g2: [
    {
      id: "gm4",
      communityId: "g2",
      alias: "Brisa Leve 31",
      text: "Alguém mais sente a ansiedade aumentar no começo da semana?",
      createdAt: minusMin(25),
      reported: true,
    },
  ],
  g3: [],
};

export const mockMessages: Record<string, ChatMessage[]> = {
  c1: [
    {
      id: "m1",
      conversationId: "c1",
      author: "system",
      text: "Conversa iniciada. Tudo o que for dito aqui é confidencial.",
      createdAt: minusMin(60),
      status: "sent",
    },
    {
      id: "m2",
      conversationId: "c1",
      author: "volunteer",
      text: "Olá! Estou aqui para escutar. Como você está se sentindo agora?",
      createdAt: minusMin(58),
      status: "sent",
    },
    {
      id: "m3",
      conversationId: "c1",
      author: "user",
      text: "Oi… tenho me sentido bem ansiosa essa semana.",
      createdAt: minusMin(57),
      status: "sent",
    },
    {
      id: "m4",
      conversationId: "c1",
      author: "volunteer",
      text: "Quer me contar o que tem te deixado assim? Sem pressa.",
      createdAt: minusMin(56),
      status: "sent",
    },
  ],
  c3: [
    {
      id: "m10",
      conversationId: "c3",
      author: "system",
      text: "Buscando um voluntário disponível…",
      createdAt: nowISO(),
      status: "sent",
    },
  ],
};

export const mockQueue: QueueEntry[] = [
  {
    id: "q1",
    alias: "Usuário 7B",
    topic: "Ansiedade",
    priority: "normal",
    waitingSince: minusMin(3),
    estimatedWait: 5,
  },
  {
    id: "q2",
    alias: "Usuário 4F",
    topic: "Tristeza",
    priority: "prioritaria",
    waitingSince: minusMin(8),
    estimatedWait: 2,
  },
  {
    id: "q3",
    alias: "Usuário 9A",
    topic: "Crise emocional",
    priority: "crise",
    waitingSince: minusMin(1),
    estimatedWait: 0,
  },
  {
    id: "q4",
    alias: "Usuário 2C",
    topic: "Solidão",
    priority: "normal",
    waitingSince: minusMin(12),
    estimatedWait: 7,
  },
];

export const mockVolunteers: Volunteer[] = [
  {
    id: "v1",
    alias: "Voluntário C.",
    initials: "CM",
    status: "online",
    rating: 4.9,
    totalSessions: 142,
    applicationStatus: "aprovado",
  },
  {
    id: "v2",
    alias: "Voluntário L.",
    initials: "LP",
    status: "ocupado",
    rating: 4.8,
    totalSessions: 89,
    applicationStatus: "aprovado",
  },
  {
    id: "v3",
    alias: "Voluntário M.",
    initials: "MR",
    status: "offline",
    rating: 4.7,
    totalSessions: 56,
    applicationStatus: "aprovado",
  },
];

export const mockApplications: Application[] = [
  {
    id: "a1",
    candidateAlias: "Candidato J.",
    submittedAt: minusMin(60 * 24 * 2),
    motivation: "Quero ajudar pessoas a se sentirem ouvidas.",
    availability: "Noites e finais de semana",
    experience: "Curso de escuta ativa.",
    status: "pendente",
  },
  {
    id: "a2",
    candidateAlias: "Candidato P.",
    submittedAt: minusMin(60 * 24 * 5),
    motivation: "Já passei por situações parecidas e gostaria de retribuir.",
    availability: "Manhãs",
    experience: "Psicologia – 6º período",
    status: "em_analise",
  },
  {
    id: "a3",
    candidateAlias: "Candidato R.",
    submittedAt: minusMin(60 * 24 * 10),
    motivation: "Acredito no poder da escuta.",
    availability: "Flexível",
    experience: "Voluntariado anterior",
    status: "aprovado",
  },
];

export const mockReports: Report[] = [
  {
    id: "r1",
    reporterAlias: "Usuário 7B",
    reportedAlias: "Voluntário X.",
    reason: "Conduta inadequada",
    details: "Voluntário fez comentários impróprios durante a conversa.",
    status: "pendente",
    priority: "alta",
    createdAt: minusMin(60 * 5),
    history: [{ at: minusMin(60 * 5), action: "Denúncia registrada", by: "Sistema" }],
  },
  {
    id: "r2",
    reporterAlias: "Usuário 3K",
    reportedAlias: "Usuário 9Z",
    reason: "Spam",
    details: "Usuário enviou várias mensagens fora do contexto.",
    status: "em_analise",
    priority: "media",
    createdAt: minusMin(60 * 30),
    history: [
      { at: minusMin(60 * 30), action: "Denúncia registrada", by: "Sistema" },
      { at: minusMin(60 * 10), action: "Atribuída a moderador", by: "Marina S." },
    ],
  },
  {
    id: "r3",
    reporterAlias: "Usuário 1A",
    reportedAlias: "Usuário 8B",
    reason: "Linguagem agressiva",
    details: "Mensagens ofensivas.",
    status: "resolvido",
    priority: "baixa",
    createdAt: minusMin(60 * 60),
    history: [
      { at: minusMin(60 * 60), action: "Denúncia registrada", by: "Sistema" },
      { at: minusMin(60 * 40), action: "Resolvido com advertência", by: "Marina S." },
    ],
  },
];

export const mockMetrics: Metrics = {
  totalUsers: 12_438,
  totalVolunteers: 312,
  activeConversations: 27,
  conversationsToday: 184,
  avgWaitMinutes: 4.2,
  satisfactionRate: 96,
  weekly: [
    { day: "Seg", conversations: 142 },
    { day: "Ter", conversations: 168 },
    { day: "Qua", conversations: 155 },
    { day: "Qui", conversations: 191 },
    { day: "Sex", conversations: 184 },
    { day: "Sáb", conversations: 220 },
    { day: "Dom", conversations: 204 },
  ],
};
