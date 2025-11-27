import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().refine((val) => /\S+@\S+\.\S+/.test(val), {message: 'Formato de correo no valido'}),
    password: z.string().min(8, {message: 'Minimo 8 caracteres'}),
});

export type LoginInput = z.infer<typeof loginSchema>;