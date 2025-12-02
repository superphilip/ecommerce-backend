import { z } from 'zod';

export const createCategorySchema =  z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    description: z.string().min(5, { message: 'La description debe tener al menos 5 caracteres' }),
});

export const updateCategorySchema = z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }).optional(),
    description: z.string().min(5, { message: 'El nombre debe tener al menos 5 caracteres' }).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;