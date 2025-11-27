import express from 'express';
import { validateBody } from '../middlewares/validateBody.js';
import { loginSchema } from '../validators/auth.validator.js';
import { changeEmailController, changePasswordController, handleAccountBlock, handleCheckPassword, handleConfirmAccount, handleForgotPassword, handleGetSessions, handleLogoutAll, handleResendCode, handleResetPassword, handleValidateToken, login, register, update } from '../controllers/auth.controller.js';
import { ConfirmationSchema, createUserSchema, ForgotPasswordSchema, ResendTokenSchema, ResetPasswordSchema, TokenParamSchema, updateUserSchema } from '../validators/user.validator.js';
import { upload } from '../middlewares/upload.middleware.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { limiter } from '../config/limiter.js';
import { validateParams } from '../middlewares/validateParams.js';


const router = express.Router();

router.use(limiter);

router.post('/login', validateBody(loginSchema), login);
router.post('/register', validateBody(createUserSchema), register);
router.put('/upload/:id', authMiddleware, upload.single('file'), validateBody(updateUserSchema), update);
router.post('/passwordchanged/:id', authMiddleware, changePasswordController);
router.post('/change-email/:id', authMiddleware, changeEmailController);
router.post('/confirm', validateBody(ConfirmationSchema), handleConfirmAccount);
router.post('/resend-code', validateBody(ResendTokenSchema), handleResendCode);
router.post('/forgot-password', validateBody(ForgotPasswordSchema), handleForgotPassword);
router.post('/validate-token', handleValidateToken);
router.post('/reset-password/:notificationToken', validateParams(TokenParamSchema), validateBody(ResetPasswordSchema), handleResetPassword);
router.post('/check-password/:id', authMiddleware, handleCheckPassword);
router.post('/logout-all/:id', authMiddleware, handleLogoutAll);
router.get('/sessions/:id', authMiddleware, handleGetSessions);
router.post('/account-block/:id', handleAccountBlock);


export default router;