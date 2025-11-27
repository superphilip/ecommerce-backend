import { Request, Response, NextFunction } from 'express';
import prisma from '../database/prismaClient.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from './asyncHandler.js';



export const authorizePermission = (requiredPermission: string) => {
    return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        
        const userId = Number(req.params.id)

        const userPermissions = await prisma.userHasRole.findMany({
            where: { idUser: userId },
            select: {
                role: {
                    select: {
                        permissions: {
                            select: { idPermission: true }
                        }
                    }
                }
            }
        });

        const userPermissionIds = userPermissions.flatMap(ur => 
            ur.role.permissions.map(rp => rp.idPermission)
        );

        const hasPermission = userPermissionIds.includes(requiredPermission);

        if (!hasPermission) {
            throw new AppError(`Acceso denegado. Permiso '${requiredPermission}' insuficiente.`, 403);
        }

        next();
    });
};