import prisma from "../database/prismaClient.js";
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { TokenPayload, verifyToken } from '../config/jwt.js';
import { asyncHandler } from "./asyncHandler.js";



export interface AuthRequest extends Request {
    user?: any
}

export const authMiddleware = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'No autorizado',
            statusCode: 401
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyToken(token!) as TokenPayload;

        if (!decoded.id) {
            throw new AppError('Token inválido: Faltan datos esenciales (ID).', 401);
        }

        const userId = decoded.id;
        const tokenSessionRevokedAt = decoded.sessionRevokedAt; 

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { sessionRevokedAt: true, status: true } 
        });

        if (!user) {
            throw new AppError('Credenciales inválidas. Usuario no existe.', 401);
        }
        
        if (user.status === 'BLOCKED' || user.status === 'DEACTIVATED') {
             throw new AppError('Acceso denegado. La cuenta está inactiva o bloqueada.', 403);
        }

        const userRevokedAt = user.sessionRevokedAt.getTime();

        if (userRevokedAt > tokenSessionRevokedAt) { 
            throw new AppError('Sesión revocada por seguridad o caducó. Inicie sesión nuevamente.', 401);
        }

        req.user = decoded;
        next();
    } catch (err) {
        throw new AppError('Token no valido o expirado', 401);
    }
});