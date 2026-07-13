import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail invalido"),
  password: z.string().min(6, "Minimo de 6 caracteres"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo").max(100),
  nickname: z.string().trim().min(2, "Informe seu apelido").max(50),
  email: z.string().email("E-mail invalido"),
  password: z
    .string()
    .min(10, "Minimo de 10 caracteres")
    .regex(/[a-z]/, "Inclua uma letra minuscula")
    .regex(/[A-Z]/, "Inclua uma letra maiuscula")
    .regex(/[0-9]/, "Inclua um numero"),
  accept: z.literal(true, { errorMap: () => ({ message: "E necessario aceitar os termos" }) }),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const recoverSchema = z.object({
  email: z.string().email("E-mail invalido"),
});

export const reportSchema = z.object({
  reportedAlias: z.string().min(1, "Informe quem esta sendo denunciado"),
  reason: z.string().min(3, "Selecione um motivo"),
  details: z.string().min(10, "Descreva com mais detalhes").max(1000),
});
export type ReportInput = z.infer<typeof reportSchema>;

export const applicationSchema = z.object({
  candidateAlias: z.string().min(2, "Informe um apelido"),
  motivation: z.string().min(20, "Conte um pouco mais (min. 20 caracteres)"),
  availability: z.string().min(3, "Informe sua disponibilidade"),
  experience: z.string().min(3, "Conte sua experiencia (ou 'nenhuma')"),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;

export const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});
