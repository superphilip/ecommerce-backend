import {z} from 'zod';

export const createUserSchema = z.object({
    name: z.string().min(2, {message: 'El nombre es obligatorio y debe tener al menos 2 caracteres'}),
    lastName: z.string().min(2, {message: 'El apellido es obligatorio y debe tener al menos 2 caracteres'}),
    email: z.string().refine((val) => /\S+@\S+\.\S+/.test(val), {message: 'Formato de correo no valido'}),
    phone: z.string().min(5, {message: 'Minimi 5 caracteres'}),
    password: z.string().min(8, {message: 'Minimo 8 caracteres'}),
});

export const updateUserSchema = z.object({
    name: z.string().min(2, {message: 'El nombre debe tener al menos 2 caracteres'}).optional(),
    lastName: z.string().min(2, {message: 'El apellido debe tener al menos 2 caracteres'}).optional(),
    phone: z.string().min(5, {message: 'Minimi 5 caracteres'}).optional(),
});

export const changePasswordSchema = z.object({
    password: z.string().min(1, 'La contraseña actual es requerida.'),
    newPassword: z.string()
        .min(8, 'La nueva contraseña debe tener al menos 8 caracteres.')
        .regex(/[A-Z]/, 'La contraseña debe ser segura: Debe tener al menos una mayúscula.')
        .regex(/[a-z]/, 'La contraseña debe ser segura: Debe tener al menos una minúscula.')
        .regex(/[0-9]/, 'La contraseña debe ser segura: Debe tener al menos un número.')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'La contraseña debe ser segura: Debe tener al menos un carácter especial.'),
});

export const changeEmailSchema = z.object({
    newEmail: z.string().refine((val) => /\S+@\S+\.\S+/.test(val), {message: 'Formato de correo no valido'}),
    password: z.string().min(1, 'Se requiere la contraseña para cambiar el email.'), 
});

export const ConfirmationSchema = z.object({
    token: z.string()
           .min(6, "El código de confirmación debe tener 6 dígitos.")
           .max(6, "El código de confirmación debe tener 6 dígitos."),
});

export const ResendTokenSchema = z.object({
    email: z.string().refine((val) => /\S+@\S+\.\S+/.test(val), { message: 'Formato de correo no valido' }),
});

export const ForgotPasswordSchema = z.object({
    email: z.string().refine((val) => /\S+@\S+\.\S+/.test(val), {message: 'Formato de correo no valido'}),
});

export const ResetPasswordSchema = z.object({
    password: z.string()
        .min(8, 'La nueva contraseña debe tener al menos 8 caracteres.')
        .regex(/[A-Z]/, 'La contraseña debe ser segura: Debe tener al menos una mayúscula.')
        .regex(/[a-z]/, 'La contraseña debe ser segura: Debe tener al menos una minúscula.')
        .regex(/[0-9]/, 'La contraseña debe ser segura: Debe tener al menos un número.')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'La contraseña debe ser segura: Debe tener al menos un carácter especial.'),
});

export const TokenParamSchema = z.object({
    notificationToken: z.string().length(6, "El código/token de la URL debe tener exactamente 6 dígitos."),
});

const ActiveSessionSchema = z.object({
    jwtId: z.string(),
    deviceType: z.string().nullable(),
    location: z.string().nullable(),
    lastAccessedAt: z.date(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type ConfirmationInput = z.infer<typeof ConfirmationSchema>;
export type ResendTokenInput = z.infer<typeof ResendTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type TokenParamInput = z.infer<typeof TokenParamSchema>;
export type ActiveSession = z.infer<typeof ActiveSessionSchema>;