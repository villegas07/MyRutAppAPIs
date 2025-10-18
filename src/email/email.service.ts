import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private emailEnabled: boolean;

  constructor(private configService: ConfigService) {
    const emailHost = this.configService.get('EMAIL_HOST');
    const emailUser = this.configService.get('EMAIL_USER');
    const emailPassword = this.configService.get('EMAIL_PASSWORD');

    // Verificar si el email está configurado
    this.emailEnabled = !!(emailHost && emailUser && emailPassword);

    if (this.emailEnabled) {
      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: this.configService.get('EMAIL_PORT'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });
      this.logger.log('Email service configurado correctamente');
    } else {
      this.logger.warn('Email service NO configurado - Los emails se simularán en consola');
    }
  }

  async sendVerificationEmail(email: string, token: string, nombre: string) {
    const verificationUrl = `${this.configService.get('FRONTEND_URL') || 'http://localhost:4200'}/auth/verify?token=${token}`;
    
    if (!this.emailEnabled) {
      this.logger.log(`📧 [SIMULADO] Email de verificación para: ${email}`);
      this.logger.log(`🔗 Token de verificación: ${token}`);
      this.logger.log(`🌐 URL: ${verificationUrl}`);
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Bienvenido a MyRut App!</h1>
            </div>
            <div class="content">
              <h2>Hola ${nombre},</h2>
              <p>Gracias por registrarte en MyRut App. Para completar tu registro y activar tu cuenta, por favor verifica tu correo electrónico haciendo clic en el botón de abajo:</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verificar mi cuenta</a>
              </p>
              <p>O copia y pega el siguiente enlace en tu navegador:</p>
              <p style="word-break: break-all;">${verificationUrl}</p>
              <p><strong>Este enlace expirará en 24 horas.</strong></p>
              <p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
            </div>
            <div class="footer">
              <p>© 2025 MyRut App. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM'),
        to: email,
        subject: 'Verifica tu cuenta - MyRut App',
        html: htmlContent,
      });
      this.logger.log(`✅ Email de verificación enviado a: ${email}`);
    } catch (error) {
      this.logger.error(`❌ Error al enviar email a ${email}:`, error.message);
      // No lanzamos el error para que el registro continúe
      this.logger.warn(`⚠️ El usuario fue registrado pero no se pudo enviar el email`);
    }
  }

  async sendPasswordResetEmail(email: string, token: string, nombre: string) {
    const resetUrl = `${this.configService.get('FRONTEND_URL') || 'http://localhost:4200'}/auth/reset-password?token=${token}`;
    
    if (!this.emailEnabled) {
      this.logger.log(`📧 [SIMULADO] Email de recuperación de contraseña para: ${email}`);
      this.logger.log(`🔗 Token: ${token}`);
      this.logger.log(`🌐 URL: ${resetUrl}`);
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Recuperar Contraseña</h1>
            </div>
            <div class="content">
              <h2>Hola ${nombre},</h2>
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en MyRut App.</p>
              <p>Para crear una nueva contraseña, haz clic en el botón de abajo:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
              </p>
              <p>O copia y pega el siguiente enlace en tu navegador:</p>
              <p style="word-break: break-all;">${resetUrl}</p>
              <p><strong>Este enlace expirará en 2 horas.</strong></p>
              <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.</p>
            </div>
            <div class="footer">
              <p>© 2025 MyRut App. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM'),
        to: email,
        subject: 'Recuperar Contraseña - MyRut App',
        html: htmlContent,
      });
      this.logger.log(`✅ Email de recuperación enviado a: ${email}`);
    } catch (error) {
      this.logger.error(`❌ Error al enviar email a ${email}:`, error.message);
    }
  }

  async sendAccountReactivationEmail(email: string, token: string, nombre: string) {
    const reactivationUrl = `${this.configService.get('FRONTEND_URL') || 'http://localhost:4200'}/auth/reactivate?token=${token}`;
    
    if (!this.emailEnabled) {
      this.logger.log(`📧 [SIMULADO] Email de reactivación para: ${email}`);
      this.logger.log(`🔗 Token: ${token}`);
      this.logger.log(`🌐 URL: ${reactivationUrl}`);
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reactivar Cuenta</h1>
            </div>
            <div class="content">
              <h2>Hola ${nombre},</h2>
              <p>Recibimos una solicitud para reactivar tu cuenta en MyRut App.</p>
              <p>Para reactivar tu cuenta, haz clic en el botón de abajo:</p>
              <p style="text-align: center;">
                <a href="${reactivationUrl}" class="button">Reactivar Mi Cuenta</a>
              </p>
              <p>O copia y pega el siguiente enlace en tu navegador:</p>
              <p style="word-break: break-all;">${reactivationUrl}</p>
              <p><strong>Este enlace expirará en 48 horas.</strong></p>
              <p>Si no solicitaste reactivar tu cuenta, puedes ignorar este correo.</p>
            </div>
            <div class="footer">
              <p>© 2025 MyRut App. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM'),
        to: email,
        subject: 'Reactivar tu Cuenta - MyRut App',
        html: htmlContent,
      });
      this.logger.log(`✅ Email de reactivación enviado a: ${email}`);
    } catch (error) {
      this.logger.error(`❌ Error al enviar email a ${email}:`, error.message);
    }
  }

  async sendAccountDeactivationEmail(email: string, nombre: string) {
    if (!this.emailEnabled) {
      this.logger.log(`📧 [SIMULADO] Email de desactivación para: ${email}`);
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Cuenta Desactivada</h1>
            </div>
            <div class="content">
              <h2>Hola ${nombre},</h2>
              <p>Tu cuenta en MyRut App ha sido desactivada exitosamente.</p>
              <p>Si deseas reactivar tu cuenta en el futuro, puedes hacerlo desde la aplicación utilizando tu correo electrónico.</p>
              <p>¡Esperamos verte de nuevo pronto!</p>
            </div>
            <div class="footer">
              <p>© 2025 MyRut App. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM'),
        to: email,
        subject: 'Cuenta Desactivada - MyRut App',
        html: htmlContent,
      });
      this.logger.log(`✅ Email de desactivación enviado a: ${email}`);
    } catch (error) {
      this.logger.error(`❌ Error al enviar email a ${email}:`, error.message);
    }
  }
}
