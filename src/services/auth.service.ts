import prisma from "../database/prismaClient.js";
import { AppError } from "../utils/AppError.js";
import type { LoginInput } from "../validators/auth.validator.js";
import { generateToken } from "../config/jwt.js";

import { formatUserResponse } from "../utils/UserUtils.js";
import { findByEmail } from "./users.service.js";

import { AuthEmail } from "../emails/AuthEmail.js";
import { fetchUserPermissions, hashedPassword, isPasswordValid } from "../utils/auth.js";
import { ActiveSession, ChangeEmailInput, ChangePasswordInput, ConfirmationInput, ConfirmationSchema, CreateUserInput, ForgotPasswordInput, ForgotPasswordSchema, ResendTokenInput, ResendTokenSchema, ResetPasswordInput, ResetPasswordSchema, UpdateUserInput } from "../validators/user.validator.js";
import type { Request as ExpressRequest } from 'express';
import { compareToken, generateRawToken, hashToken } from "../utils/Token.js";
import { fileURLToPath } from "url";
import { dirname } from "path";


const MAX_CANDIDATES_SEARCH = parseInt(process.env.MAX_CANDIDATES_SEARCH ?? '10', 10);
const MAX_ATTEMPTS = parseInt(process.env.MAX_ATTEMPTS ?? '5', 5);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export const register = async (data: CreateUserInput) => {
    const { name, lastName, email, phone, password } = data;

    const existingUser = await findByEmail(email);
    if (existingUser) {
        throw new AppError('El correo electrónico ya está registrado', 409);
    }

    const hasPassword = await hashedPassword(password);
    const rawToken = generateRawToken(6);
    const tokenHash = await hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                name,
                lastName,
                email,
                phone,
                password: hasPassword,
            },
        });

        const clientRole = await tx.role.findUnique({
            where: { id: 'CLIENT' },
        });

        if (!clientRole) {
            throw new AppError('El Rol del cliente no existe', 404);
        }

        await tx.userHasRole.create({
            data: {
                idUser: user.id,
                idRole: clientRole.id,
            },
        });

        const tokenRow = await tx.emailActionToken.create({
            data: {
                userId: user.id,
                action: 'CONFIRM_NEW_EMAIL',
                newEmail: user.email,
                tokenHash,
                expiresAt,
            },
        });

        return {
            user,
            tokenId: tokenRow.id,
        };
    });

    await AuthEmail.sendConfirmationEmail({
        name: result.user.name,
        lastName: result.user.lastName,
        email: result.user.email,
        tokenId: result.tokenId,
        token: rawToken,
        tokenExpires: expiresAt,
    });

    return {
        message: 'Registro exitoso. Revisa tu correo electrónico para activar tu cuenta.',
    };
};

export const update = async (id: number, data: UpdateUserInput, file?: Express.Multer.File) => {
    const user = await prisma.user.findUnique({
        where: {
            id: id
        }
    });

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    let imagePath = user.image;
    if (file) {
        imagePath = `/uploads/auth/${id}/${file.filename}`;
    }

    const updateUser = await prisma.user.update({
        where: {
            id: id
        },
        data: {
            name: data.name ?? user.name,
            lastName: data.lastName ?? user.lastName,
            phone: data.phone ?? user.phone,
            image: imagePath
        },
        include: {
            roles: {
                include: {
                    role: true
                }
            }
        }
    });

    const userFormatted = formatUserResponse(updateUser, updateUser.roles);

    return userFormatted;
}

export const loginUser = async (data: LoginInput, req: ExpressRequest) => {
    const user = await prisma.user.findUnique({
        where: {
            email: data.email
        },
        include: {
            roles: {
                include: {
                    role: true
                }
            }
        }
    });

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    if (user.status == 'PENDING') {
        throw new AppError('La cuenta no ha sido confirmada', 403);
    }

    if (user.status === 'BLOCKED' || user.status === 'DEACTIVATED') {
        throw new AppError('Acceso denegado. La cuenta está inactiva o bloqueada.', 403);
    }

    const isPasswordCorrect = await isPasswordValid(data.password, user.password);
    if (!isPasswordCorrect) {
        throw new AppError('Credenciales inválidas.', 401);
    }

    const userPermissions = await fetchUserPermissions(user.id);

    const { token, jwtId } = generateToken({
        id: user.id,
        email: user.email,
        permissions: userPermissions,
        sessionRevokedAt: user.sessionRevokedAt.getTime(),
    });

    const forwardedIp = req.get('x-forwarded-for')?.split(',').shift()?.trim();
    const directIp = (req as any).socket.remoteAddress;
    const ipAddress = forwardedIp ?? directIp;
    const finalIp = (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') ? '127.0.0.1' : ipAddress;


    await prisma.session.create({
        data: {
            userId: user.id,
            jwtId: jwtId,
            deviceType: req.get('user-agent') ?? 'App Flutter/Web',
            ipAddress: finalIp,
            location: 'Unknown Location', // Usar geolocalización real aquí
            deviceId: req.get('x-device-id') ?? 'default',
        },
    });

    const userFormatted = formatUserResponse(user, user.roles);

    return {
        "user": userFormatted,
        "token": `Bearer ${token}`
    }
}

export const changePassword = async (userId: number, data: ChangePasswordInput) => {

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true }
    });

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    const isPasswordV = await isPasswordValid(data.password, user.password);

    if (!isPasswordV) {
        throw new AppError('La contraseña actual es incorrecta.', 401);
    }

    const newHashedPassword = await hashedPassword(data.newPassword);

    await prisma.$transaction(async (tx) => {

        const isSameAsCurrent = await isPasswordValid(data.newPassword, user.password);

        if (isSameAsCurrent) {
            throw new AppError('La nueva contraseña no puede ser igual a la actual.', 400);
        }

        const history = await tx.passwordHistory.findMany({
            where: { userId: user.id },
            select: { hash: true, createdAt: true }
        });

        const comparisonResults = await Promise.all(
            history.map(h => isPasswordValid(data.newPassword, h.hash))
        );

        const matchIndex = comparisonResults.findIndex(isMatch => isMatch);

        if (matchIndex !== -1) {
            const lastUsedDate = history[matchIndex].createdAt;

            const formattedDate = lastUsedDate.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const formattedTime = lastUsedDate.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const finalMessage = `La contraseña elegida ya fue utilizada el ${formattedDate} a las ${formattedTime}. Debes usar una contraseña nueva.`;

            throw new AppError(finalMessage, 400);
        }

        await tx.passwordHistory.create({
            data: {
                userId: user.id,
                hash: user.password,
            }
        });

        const now = new Date();

        await tx.user.update({
            where: { id: userId },
            data: {
                password: newHashedPassword,
                sessionRevokedAt: now,
            },
        });
    });

    return { message: 'Contraseña actualizada exitosamente.' };
};

export const changeEmail = async (userId: number, data: ChangeEmailInput) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new AppError('Usuario no encontrado', 404);

    const isPasswordV = await isPasswordValid(data.password, user.password);
    if (!isPasswordV) throw new AppError('Contraseña incorrecta. No se puede cambiar el email.', 401);

    const existingUser = await findByEmail(data.newEmail);
    if (existingUser) throw new AppError('Este correo electrónico ya está en uso por otra cuenta.', 409);

    const rawConfirm = generateRawToken(6);
    const rawRevert = generateRawToken(6);
    const hashConfirm = await hashToken(rawConfirm);
    const hashRevert = await hashToken(rawRevert);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
        const confirm = await tx.emailActionToken.create({
            data: {
                userId: user.id,
                action: 'CONFIRM_NEW_EMAIL',
                oldEmail: user.email,
                newEmail: data.newEmail,
                tokenHash: hashConfirm,
                expiresAt,
            },
        });

        const revert = await tx.emailActionToken.create({
            data: {
                userId: user.id,
                action: 'REVERT_EMAIL',
                oldEmail: user.email,
                newEmail: data.newEmail,
                tokenHash: hashRevert,
                expiresAt,
            },
        });

        await tx.user.update({
            where: { id: userId },
            data: {
                email: data.newEmail,
                status: 'PENDING',
                sessionRevokedAt: now,
            },
        });

        await tx.accountAction.create({
            data: {
                userId: user.id,
                action: 'EMAIL_CHANGE_REQUESTED',
                metadata: { oldEmail: user.email, newEmail: data.newEmail },
            },
        });

        return { confirmId: confirm.id, revertId: revert.id, expiresAt };
    });

    await AuthEmail.sendEmailChangeNotification({
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        tokenId: result.revertId,
        token: rawRevert,
        tokenExpires: result.expiresAt,
    });

    await AuthEmail.sendConfirmationEmail({
        name: user.name,
        lastName: user.lastName,
        email: data.newEmail,
        tokenId: result.confirmId,
        token: rawConfirm,
        tokenExpires: result.expiresAt,
    });

    return {
        message: 'Correo electrónico actualizado en estado PENDING. Se enviaron instrucciones al correo anterior y al nuevo para confirmar.',
    };
};


export const confirmAccount = async (data: ConfirmationInput) => {
    const { token } = ConfirmationSchema.parse(data);

    const candidates = await prisma.emailActionToken.findMany({
        where: {
            action: 'CONFIRM_NEW_EMAIL',
            consumedAt: null,
            expiresAt: { gte: new Date() },
        },
        orderBy: { createdAt: 'desc' },
        take: MAX_CANDIDATES_SEARCH,
    });

    if (!candidates || candidates.length === 0) {
        throw new AppError('Código inválido o expirado.', 400);
    }

    for (const candidate of candidates) {
        const ok = await compareToken(token, candidate.tokenHash);
        if (ok) {
            const user = await prisma.user.findUnique({
                where: { id: candidate.userId },
                select: { id: true, status: true },
            });

            if (!user) throw new AppError('Usuario no encontrado', 404);
            if (user.status === 'ACTIVE') throw new AppError('Esta cuenta ya ha sido activada anteriormente.', 409);

            const now = new Date();
            await prisma.$transaction(async (tx) => {
                await tx.user.update({ where: { id: user.id }, data: { status: 'ACTIVE' } });
                await tx.emailActionToken.update({ where: { id: candidate.id }, data: { consumedAt: now } });
                await tx.accountAction.create({
                    data: { userId: user.id, action: 'CONFIRM_NEW_EMAIL', metadata: { newEmail: candidate.newEmail } },
                });
            });

            return { message: 'Cuenta activada con éxito. ¡Bienvenido!' };
        }
    }

    const target = candidates[0];
    const after = (target.failedAttempts ?? 0) + 1;
    const updates: any = { failedAttempts: after };
    if (after >= MAX_ATTEMPTS) updates.consumedAt = new Date();
    await prisma.emailActionToken.update({ where: { id: target.id }, data: updates });

    if (after >= MAX_ATTEMPTS) throw new AppError('Token bloqueado por demasiados intentos', 400);
    throw new AppError('Código de verificación inválido.', 400);
};

export const resendVerificationCode = async (data: ResendTokenInput) => {
    const { email } = ResendTokenSchema.parse(data);

    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, status: true, name: true, lastName: true, email: true },
    });

    if (!user) {
        throw new AppError('Usuario no encontrado con ese correo electrónico.', 404);
    }

    if (user.status === 'ACTIVE') {
        throw new AppError('La cuenta ya está activa. Intenta iniciar sesión.', 409);
    }

    const rawToken = generateRawToken(6);
    const tokenHash = await hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    const result = await prisma.$transaction(async (tx) => {
        await tx.emailActionToken.updateMany({
            where: {
                userId: user.id,
                action: 'CONFIRM_NEW_EMAIL',
                consumedAt: null,
            },
            data: {
                consumedAt: new Date(),
            },
        });

        const tokenRow = await tx.emailActionToken.create({
            data: {
                userId: user.id,
                action: 'CONFIRM_NEW_EMAIL',
                newEmail: user.email,
                tokenHash,
                expiresAt,
            },
        });

        await tx.accountAction.create({
            data: {
                userId: user.id,
                action: 'RESEND_CONFIRMATION_CODE',
                metadata: { reason: 'user_requested' },
            },
        });

        return { tokenId: tokenRow.id, expiresAt };
    });

    await AuthEmail.sendConfirmationEmail({
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        tokenId: result.tokenId,
        token: rawToken,
        tokenExpires: result.expiresAt,
    });

    return {
        message: 'Nuevo código de verificación enviado con éxito a tu correo electrónico.',
    };
};

export const forgotPassword = async (data: ForgotPasswordInput) => {
    const { email } = ForgotPasswordSchema.parse(data);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    if (user.status !== 'ACTIVE') {
        throw new AppError('La cuenta no está activa o está bloqueada. Contacte a soporte.', 403);
    }

    const rawToken = generateRawToken(6);
    const tokenHash = await hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
        await tx.emailActionToken.updateMany({
            where: {
                userId: user.id,
                action: 'PASSWORD_RESET',
                consumedAt: null,
            },
            data: {
                consumedAt: now,
            },
        });

        const tokenRow = await tx.emailActionToken.create({
            data: {
                userId: user.id,
                action: 'PASSWORD_RESET',
                newEmail: user.email,
                tokenHash,
                expiresAt,
            },
        });

        await tx.accountAction.create({
            data: {
                userId: user.id,
                action: 'PASSWORD_RESET_REQUESTED',
                metadata: { reason: 'user_requested' },
            },
        });

        await tx.user.update({
            where: { id: user.id },
            data: { sessionRevokedAt: now },
        });

        return { tokenId: tokenRow.id, expiresAt };
    });

    await AuthEmail.sendPasswordResetToken({
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        tokenId: result.tokenId,
        token: rawToken,
        tokenExpires: result.expiresAt,
    });

    return { message: "Se ha enviado un código de restablecimiento de contraseña a su correo." };
};


export const validateToken = async (data: ConfirmationInput) => {
    const { token } = ConfirmationSchema.parse(data);

    const candidates = await prisma.emailActionToken.findMany({
        where: {
            action: 'CONFIRM_NEW_EMAIL',
            consumedAt: null,
            expiresAt: { gte: new Date() },
        },
        orderBy: { createdAt: 'desc' },
        take: MAX_CANDIDATES_SEARCH,
    });

    if (!candidates || candidates.length === 0) {
        throw new AppError('Token no válido.', 404);
    }

    for (const candidate of candidates) {
        const ok = await compareToken(token, candidate.tokenHash);
        if (ok) {
            return {
                message: 'Token válido.',
                tokenId: candidate.id,
                userId: candidate.userId,
                newEmail: candidate.newEmail,
            };
        }
    }

    const target = candidates[0];
    const after = (target.failedAttempts ?? 0) + 1;
    const updates: any = { failedAttempts: after };
    if (after >= MAX_ATTEMPTS) updates.consumedAt = new Date();

    await prisma.emailActionToken.update({
        where: { id: target.id },
        data: updates,
    });

    if (after >= MAX_ATTEMPTS) {
        throw new AppError('Token bloqueado por demasiados intentos', 400);
    }

    throw new AppError('Token no válido.', 400);
};

export const resetPassword = async (token: string, data: ResetPasswordInput) => {
  const { password } = ResetPasswordSchema.parse(data);
  

  const candidates = await prisma.emailActionToken.findMany({
    where: {
      action: 'PASSWORD_RESET',
      consumedAt: null,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    take: MAX_CANDIDATES_SEARCH,
  });

  if (!candidates || candidates.length === 0) {
    throw new AppError('Token no válido o expirado.', 400);
  }

  for (const candidate of candidates) {
    const ok = await compareToken(token, candidate.tokenHash);
    if (!ok) continue;

    const user = await prisma.user.findUnique({ where: { id: candidate.userId } });
    if (!user) throw new AppError('Usuario no encontrado.', 404);

    const isSameAsCurrent = await isPasswordValid(password, user.password);
    if (isSameAsCurrent) {
      throw new AppError('La nueva contraseña no puede ser igual a la actual.', 400);
    }

    const hashPassword = await hashedPassword(password);
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      const history = await tx.passwordHistory.findMany({
        where: { userId: user.id },
        select: { hash: true, createdAt: true },
      });

      const comparisonResults = await Promise.all(history.map(h => isPasswordValid(password, h.hash)));
      const matchIndex = comparisonResults.findIndex(Boolean);

      if (matchIndex !== -1) {
        const lastUsedDate = history[matchIndex].createdAt;
        const formattedDate = lastUsedDate.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const formattedTime = lastUsedDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const finalMessage = `La contraseña elegida ya fue utilizada el ${formattedDate} a las ${formattedTime}. Debes usar una contraseña nueva.`;
        throw new AppError(finalMessage, 400);
      }

      await tx.passwordHistory.create({
        data: {
          userId: user.id,
          hash: user.password,
        },
      });

      await tx.emailActionToken.updateMany({
        where: {
          userId: user.id,
          action: 'PASSWORD_RESET',
          consumedAt: null,
        },
        data: {
          consumedAt: now,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          password: hashPassword,
          sessionRevokedAt: now,
        },
      });

      await tx.session.deleteMany({
        where: {
          userId: user.id,
        },
      });

      await tx.accountAction.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET',
          metadata: { by: 'token' },
        },
      });
    });

    return { message: 'Contraseña restablecida con éxito. Ya puedes iniciar sesión.' };
  }

  const target = candidates[0];
  const after = (target.failedAttempts ?? 0) + 1;
  const updates: any = { failedAttempts: after };
  if (after >= MAX_ATTEMPTS) updates.consumedAt = new Date();

  await prisma.emailActionToken.update({
    where: { id: target.id },
    data: updates,
  });

  if (after >= MAX_ATTEMPTS) {
    throw new AppError('Token bloqueado por demasiados intentos', 400);
  }

  throw new AppError('Token no válido.', 400);
};


export const checkPassword = async (userId: number, data: ResetPasswordInput) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true }
    });

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    const isPasswordV = await isPasswordValid(data.password, user.password);

    if (!isPasswordV) {
        throw new AppError('La contraseña actual es incorrecta.', 401);
    }

    return { message: 'Contraseña válida.' };
}

export const logoutAll = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  const now = new Date();

  const deleted = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { sessionRevokedAt: now },
    });

    const delRes = await tx.session.deleteMany({
      where: { userId },
    });

    return delRes;
  });

  return {
    message: `Se han cerrado y eliminado ${deleted.count} sesión(es) anteriores al ${now.toLocaleString('es-ES')}.`,
  };
};

export const getActiveSessions = async (userId: number) => {

    const sessions = await prisma.session.findMany({
        where: {
            userId: userId
        },
        orderBy: {
            lastAccessedAt: 'desc'
        },
        select: {
            jwtId: true,
            deviceType: true,
            location: true,
            lastAccessedAt: true,
        },
    });

    return sessions;
};

export const accountBlock = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, email: true, name: true, lastName: true },
  });

  if (!user) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  if (user.status === 'BLOCKED') {
    return { message: 'La cuenta ya estaba bloqueada.' };
  }

  const now = new Date();

  const { deletedCount } = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        status: 'BLOCKED',
        sessionRevokedAt: now,
      },
    });

    const delRes = await tx.session.deleteMany({
      where: { userId },
    });

    await tx.accountAction.create({
      data: {
        userId,
        action: 'ACCOUNT_BLOCKED',
        metadata: { reason: 'admin_block' },
      },
    });

    return { deletedCount: delRes.count };
  });

  try {
    await AuthEmail.sendBloqueoAdmin({
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
    });
  } catch (emailError) {
    console.error('Error al enviar notificación de bloqueo de cuenta:', emailError);
  }

  return {
    message: `La cuenta ha sido bloqueada y ${deletedCount} sesión(es) anteriores han sido cerradas y eliminadas.`,
  };
};