import { z } from 'zod';

export const createProdcutSchema =  z.object({
    id_category: z.coerce.number().refine((val) => val > 0, {message: 'La categoria es obligatoria' }),
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    description: z.string().min(5, { message: 'La description debe tener al menos 5 caracteres' }),
    price: z.coerce.number().positive({ message: 'El precio debe ser mayor a cero' }),
});

export const UpdateProductSchema =  z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }).optional(),
    description: z.string().min(5, { message: 'La description debe tener al menos 5 caracteres' }).optional(),
    price: z.coerce.number().positive({ message: 'El precio debe ser mayor a cero' }).optional(),
});

export type CreateProductInput = z.infer<typeof createProdcutSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;