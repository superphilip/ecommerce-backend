import {email, z} from 'zod';

export const createUserSchema = z.object({
    firstName: z.string().min(2, {message: 'El nombre es obligatorio y debe tener al menos 2 caracteres'}),
    lastName: z.string().min(2, {message: 'El apellido es obligatorio y debe tener al menos 2 caracteres'}),
    email: z.string().refine((val) => /\S+@\S+\.\S+/.test(val), {message: 'Formato de correo no valido'}),
    phone: z.string().min(5, {message: 'Minimi 5 caracteres'}),
    password: z.string().min(8, {message: 'Minimo 8 caracteres'}),
});
