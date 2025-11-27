import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { changeEmailSchema } from '../validators/user.validator.js';
import { AppError } from '../utils/AppError.js';
import { getActiveSessions } from '../services/auth.service.js';



export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.register(req.body);
    res.status(200).json(result);
});

export const update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const id = Number(req.params.id);
    const data = req.body;
    const file = req.file;
    const user = await authService.update(id, data, file);
    res.status(200).json(user);

});

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.loginUser(req.body, req);
    res.status(200).json(result);
});

export const handleConfirmAccount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.confirmAccount(req.body);
    res.status(200).json(result);
});

export const handleResendCode = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.resendVerificationCode(req.body);
    res.status(200).json(result);
});

export const changePasswordController = asyncHandler(async (req: Request, res: Response) => {
    const userId = Number(req.params.id);
    const result = await authService.changePassword(userId, req.body);
    res.status(200).json(result);
});

export const changeEmailController = asyncHandler(async (req: Request, res: Response) => {

    const userId = Number(req.params.id);

    if (isNaN(userId) || userId <= 0) {
        throw new AppError('ID de usuario inválido en los parámetros de la ruta.', 400);
    }

    const validationResult = changeEmailSchema.safeParse(req.body);
    if (!validationResult.success) {
        throw new AppError('Datos de entrada inválidos para el email.', 400);
    }

    const result = await authService.changeEmail(userId, validationResult.data);

    res.status(200).json(result);
});

export const handleForgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.forgotPassword(req.body);
    res.status(200).json(result);
});

export const handleValidateToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.validateToken(req.body);
    res.status(200).json(result);
});

export const handleResetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { notificationToken } = req.params;
    const result = await authService.resetPassword(notificationToken, req.body);
    res.status(200).json(result);
});

export const handleCheckPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = Number(req.params.id);
    const result = await authService.checkPassword(userId, req.body);
    res.status(200).json(result);
});

export const handleLogoutAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = Number(req.params.id);
    const result = await authService.logoutAll(userId);
    res.status(200).json(result);
});

export const handleGetSessions = asyncHandler(async (req: Request, res: Response) => {
    const userId = Number(req.params.id);
    const sessions = await getActiveSessions(userId);
    res.status(200).json(sessions);
});

export const handleAccountBlock = asyncHandler(async (req: Request, res: Response) => {
    const userId = Number(req.params.id);
    const result = await authService.accountBlock(userId);
    res.status(200).json(result);
});

