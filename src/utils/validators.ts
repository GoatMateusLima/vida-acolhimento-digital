import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Mínimo de 8 caracteres"),
  accept: z.literal(true, { errorMap: () => ({ message: "É necessário aceitar os termos" }) }),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const recoverSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const reportSchema = z.object({
  reportedAlias: z.string().min(1, "Informe quem está sendo denunciado"),
  reason: z.string().min(3, "Selecione um motivo"),
  details: z.string().min(10, "Descreva com mais detalhes").max(1000),
});
export type ReportInput = z.infer<typeof reportSchema>;

export const applicationSchema = z.object({
  candidateAlias: z.string().min(2, "Informe um apelido"),
  motivation: z.string().min(20, "Conte um pouco mais (mín. 20 caracteres)"),
  availability: z.string().min(3, "Informe sua disponibilidade"),
  experience: z.string().min(3, "Conte sua experiência (ou 'nenhuma')"),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;

export const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});
