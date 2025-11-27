
import { AppError } from "../utils/AppError";
import { Request, Response, NextFunction } from "express";
import { ZodObject, z } from 'zod';

export const validateParams = (schema: ZodObject) => 
    (req: Request<Record<string, string>, unknown, unknown>, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.params); 
            
            next();

        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessages = error.issues.map(err => 
                    `Parámetro: ${err.path.join('.')} | Mensaje: ${err.message}`
                );

                return next(new AppError(`Fallo de validación de parámetros. ${errorMessages.join(' | ')}`, 400));
            }
            
            next(error);
        }
    };