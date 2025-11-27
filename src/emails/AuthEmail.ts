import { transport } from "../config/nodemailer.js";


type EmailType = {
    id?: number
    name: string,
    lastName: string,
    email: string,
    tokenId?: string,
    token?: string,
    tokenExpires?: Date
}

const genericLinkUrl = `${process.env.APP_SCHEME}://${process.env.APP_HOST}`;
const adminEmail = process.env.ADMIN_EMAIL;
const now = new Date();

export class AuthEmail {
    static sendConfirmationEmail = async (user: EmailType) => {
        const email = await transport.sendMail({
            from: 'Ecommerce <admin@gmail.com>',
            to: user.email,
            subject: 'Ecommerce - Confirma tu cuenta',
            html: `
                <p>Hola: ${user.name + ' ' + user.lastName}, has creado tu cuenta en Ecommerce, ya esta casi lista</p>
                <p>Visita el siguiente enlace:</p>
                <a href="${genericLinkUrl}"}/auth/confirm">Confirmar cuenta</a>
                <p>ingresa el código: <b>${user.token}</b></p>
                <p>su token expira: <b>${user.tokenExpires}</b></p>
            `
        })
        //para personalizar la plantilla html del correo se debe usar mailwind
        console.log('Mensaje enviado', email.messageId)
    }

    static sendPasswordResetToken = async (user: EmailType) => {
        const email = await transport.sendMail({
            from: 'Ecommerce <admin@gmail.com>',
            to: user.email,
            subject: 'Ecommerce - Reestablece tu password',
            html: `
                <p>Hola: ${user.name + ' ' + user.lastName}, has solicitado reestablecer tu password</p>
                <p>Visita el siguiente enlace:</p>
                <a href="${genericLinkUrl}"}/auth/reset-password/${user.token}>Reestablecer Password</a>
                <p>ingresa el código: <b>${user.token}</b></p>
                <p>su token expira: <b>${user.tokenExpires}</b></p>
            `
        })
    }

    static sendBloqueoAdmin = async (user: EmailType) => {
        const email = await transport.sendMail({
            to: adminEmail,
            subject: `🚨 CUENTA BLOQUEADA: Usuario ${user.name + ' ' + user.lastName}`,
            html: `
                <p style="color: red; font-size: 1.2em; font-weight: bold;">🚨La cuenta del usuario ${user.name + ' ' + user.lastName} (ID: ${user.id}) ha sido marcada como BLOQUEADA.</p>
                <p>Email: ${user.email}</p>
                <p>Fecha de bloqueo: ${now.toLocaleString('es-ES')}</p>
                <p>Por favor, revisa el panel de administración para más detalles y acciones necesarias.</p>
                
            `
        })
        //para personalizar la plantilla html del correo se debe usar mailwind
        console.log('Mensaje enviado', email.messageId)
    }

    static sendEmailChangeNotification = async (user: EmailType) => {

        const email = await transport.sendMail({
            from: 'Ecommerce Security <admin@gmail.com>',
            to: user.email, // El correo antiguo
            subject: 'Ecommerce - Notificación de cambio de email',
            html: `
            <p><strong>Hola ${user.name + ' ' + user.lastName},</strong></p>
            <p style="color: red; font-size: 1.2em; font-weight: bold;">
                ALERTA: Se ha solicitado el cambio de email de tu cuenta.
            </p>
            <p>
                Este email está llegando a tu dirección antigua para notificarte sobre una actividad reciente.
            </p>
            
            <p style="margin-top: 20px;">
                <strong>Si NO RECONOCES esta actividad,</strong> tu cuenta puede estar comprometida. 
                Toma acción inmediata:
            </p>
            
            <hr style="border: 1px solid #eee;">

            <p><strong>1. ACCIÓN URGENTE (Bloqueo):</strong> Congela el acceso al atacante.</p>
            <p style="text-align: center;">
                <a href="${genericLinkUrl}"}/auth/accountblock/${user.id}>"
                   style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                   BLOQUEAR CUENTA Y CONTACTAR SOPORTE
                </a>
            </p>

            <p><strong>2. RECUPERACIÓN:</strong> Cambia tu contraseña.</p>
            <p style="text-align: center;">
                <a href="${genericLinkUrl}"}/auth/reset-password/${user.token}>"
                   style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                   CAMBIAR CONTRASEÑA
                </a>
            </p>
            
            <p><strong>3. SESIONES:</strong> Fuerza el cierre de sesión en todos los dispositivos.</p>
            <p style="text-align: center;">
                <a href="${genericLinkUrl}"}/auth/activesessions" 
                   style="color: #007bff; text-decoration: underline;">
                   Cerrar Sesión en Todo Lugar
                </a>
            </p>
            
            <hr style="border: 1px solid #eee;">
            <p>Gracias por mantener tu cuenta segura.</p>
        `
        });
    };
}