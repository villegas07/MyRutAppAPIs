import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Verificar si el email ya existe
    // Verificar si el email ya existe
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Verificar si el nombre de usuario ya existe
    const existingUsername = await this.prisma.usuario.findUnique({
      where: { nombre_usuario: registerDto.nombre_usuario },
    });

    if (existingUsername) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Crear usuario
    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: registerDto.nombre,
        apellido: registerDto.apellido,
        nombre_usuario: registerDto.nombre_usuario,
        email: registerDto.email,
        telefono: registerDto.telefono,
        password_hash: hashedPassword,
        fecha_nacimiento: registerDto.fecha_nacimiento 
          ? new Date(registerDto.fecha_nacimiento) 
          : null,
        verificado: false,
        estado_cuenta: 'activo',
      },
    });

    // Generar token de verificación
    const verificationToken = await this.createVerificationToken(
      usuario.id_usuario,
      'verificacion_email',
    );

    // Enviar email de verificación
    await this.emailService.sendVerificationEmail(
      usuario.email,
      verificationToken,
      usuario.nombre,
    );

    return {
      message: 'Usuario registrado exitosamente. Por favor verifica tu email.',
      usuario: {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        nombre_usuario: usuario.nombre_usuario,
      },
    };
  }

  async login(loginDto: LoginDto) {
    // Buscar usuario
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: loginDto.email },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      usuario.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si la cuenta está activa
    if (usuario.estado_cuenta !== 'activo') {
      throw new UnauthorizedException(
        'Tu cuenta está inactiva. Por favor contacta soporte o solicita reactivación.',
      );
    }

    // Verificar si el email está verificado
    if (!usuario.verificado) {
      throw new UnauthorizedException(
        'Por favor verifica tu email antes de iniciar sesión',
      );
    }

    // Actualizar último acceso
    await this.prisma.usuario.update({
      where: { id_usuario: usuario.id_usuario },
      data: { ultimo_acceso: new Date() },
    });

    // Generar tokens
    const tokens = await this.generateTokens(usuario.id_usuario, usuario.email);

    // Guardar refresh token
    const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
    await this.prisma.usuario.update({
      where: { id_usuario: usuario.id_usuario },
      data: { refresh_token: hashedRefreshToken },
    });

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      usuario: {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        foto_perfil: usuario.foto_perfil,
      },
    };
  }

  async verifyEmail(token: string) {
    const tokenRecord = await this.prisma.tokenVerificacion.findUnique({
      where: { token },
      include: { usuario: true },
    });

    if (!tokenRecord) {
      throw new BadRequestException('Token inválido');
    }

    if (tokenRecord.usado) {
      throw new BadRequestException('Este token ya ha sido usado');
    }

    if (new Date() > tokenRecord.fecha_expira) {
      throw new BadRequestException('El token ha expirado');
    }

    if (tokenRecord.tipo !== 'verificacion_email') {
      throw new BadRequestException('Token inválido para esta operación');
    }

    // Marcar usuario como verificado
    await this.prisma.usuario.update({
      where: { id_usuario: tokenRecord.id_usuario },
      data: { verificado: true },
    });

    // Marcar token como usado
    await this.prisma.tokenVerificacion.update({
      where: { id_token: tokenRecord.id_token },
      data: { usado: true },
    });

    return {
      message: 'Email verificado exitosamente. Ya puedes iniciar sesión.',
    };
  }

  async resendVerificationEmail(email: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (usuario.verificado) {
      throw new BadRequestException('El email ya está verificado');
    }

    // Invalidar tokens anteriores
    await this.prisma.tokenVerificacion.updateMany({
      where: {
        id_usuario: usuario.id_usuario,
        tipo: 'verificacion_email',
        usado: false,
      },
      data: { usado: true },
    });

    // Crear nuevo token
    const verificationToken = await this.createVerificationToken(
      usuario.id_usuario,
      'verificacion_email',
    );

    // Reenviar email
    await this.emailService.sendVerificationEmail(
      usuario.email,
      verificationToken,
      usuario.nombre,
    );

    return {
      message: 'Email de verificación reenviado',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: forgotPasswordDto.email },
    });

    if (!usuario) {
      // Por seguridad, no revelamos si el email existe o no
      return {
        message: 'Si el email existe, recibirás un enlace para recuperar tu contraseña',
      };
    }

    // Invalidar tokens anteriores de recuperación
    await this.prisma.tokenVerificacion.updateMany({
      where: {
        id_usuario: usuario.id_usuario,
        tipo: 'recuperar_password',
        usado: false,
      },
      data: { usado: true },
    });

    // Crear token de recuperación
    const resetToken = await this.createVerificationToken(
      usuario.id_usuario,
      'recuperar_password',
      2, // 2 horas
    );

    // Enviar email
    await this.emailService.sendPasswordResetEmail(
      usuario.email,
      resetToken,
      usuario.nombre,
    );

    return {
      message: 'Si el email existe, recibirás un enlace para recuperar tu contraseña',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const tokenRecord = await this.prisma.tokenVerificacion.findUnique({
      where: { token: resetPasswordDto.token },
      include: { usuario: true },
    });

    if (!tokenRecord) {
      throw new BadRequestException('Token inválido');
    }

    if (tokenRecord.usado) {
      throw new BadRequestException('Este token ya ha sido usado');
    }

    if (new Date() > tokenRecord.fecha_expira) {
      throw new BadRequestException('El token ha expirado');
    }

    if (tokenRecord.tipo !== 'recuperar_password') {
      throw new BadRequestException('Token inválido para esta operación');
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(resetPasswordDto.new_password, 10);

    // Actualizar contraseña
    await this.prisma.usuario.update({
      where: { id_usuario: tokenRecord.id_usuario },
      data: {
        password_hash: hashedPassword,
        refresh_token: null, // Invalidar sesiones activas
      },
    });

    // Marcar token como usado
    await this.prisma.tokenVerificacion.update({
      where: { id_token: tokenRecord.id_token },
      data: { usado: true },
    });

    return {
      message: 'Contraseña actualizada exitosamente',
    };
  }

  async deactivateAccount(userId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: userId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (usuario.estado_cuenta === 'inactivo') {
      throw new BadRequestException('La cuenta ya está inactiva');
    }

    // Desactivar cuenta
    await this.prisma.usuario.update({
      where: { id_usuario: userId },
      data: {
        estado_cuenta: 'inactivo',
        refresh_token: null, // Cerrar sesiones
      },
    });

    // Enviar email de confirmación
    await this.emailService.sendAccountDeactivationEmail(
      usuario.email,
      usuario.nombre,
    );

    return {
      message: 'Cuenta desactivada exitosamente',
    };
  }

  async requestReactivation(email: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (usuario.estado_cuenta === 'activo') {
      throw new BadRequestException('La cuenta ya está activa');
    }

    // Invalidar tokens anteriores
    await this.prisma.tokenVerificacion.updateMany({
      where: {
        id_usuario: usuario.id_usuario,
        tipo: 'reactivar_cuenta',
        usado: false,
      },
      data: { usado: true },
    });

    // Crear token de reactivación
    const reactivationToken = await this.createVerificationToken(
      usuario.id_usuario,
      'reactivar_cuenta',
      48, // 48 horas
    );

    // Enviar email
    await this.emailService.sendAccountReactivationEmail(
      usuario.email,
      reactivationToken,
      usuario.nombre,
    );

    return {
      message: 'Se ha enviado un enlace de reactivación a tu email',
    };
  }

  async reactivateAccount(token: string) {
    const tokenRecord = await this.prisma.tokenVerificacion.findUnique({
      where: { token },
      include: { usuario: true },
    });

    if (!tokenRecord) {
      throw new BadRequestException('Token inválido');
    }

    if (tokenRecord.usado) {
      throw new BadRequestException('Este token ya ha sido usado');
    }

    if (new Date() > tokenRecord.fecha_expira) {
      throw new BadRequestException('El token ha expirado');
    }

    if (tokenRecord.tipo !== 'reactivar_cuenta') {
      throw new BadRequestException('Token inválido para esta operación');
    }

    // Reactivar cuenta
    await this.prisma.usuario.update({
      where: { id_usuario: tokenRecord.id_usuario },
      data: { estado_cuenta: 'activo' },
    });

    // Marcar token como usado
    await this.prisma.tokenVerificacion.update({
      where: { id_token: tokenRecord.id_token },
      data: { usado: true },
    });

    return {
      message: 'Cuenta reactivada exitosamente. Ya puedes iniciar sesión.',
    };
  }

  async refreshToken(userId: number, refreshToken: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: userId },
    });

    if (!usuario || !usuario.refresh_token) {
      throw new UnauthorizedException('Acceso denegado');
    }

    // Verificar refresh token
    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      usuario.refresh_token,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Acceso denegado');
    }

    // Generar nuevos tokens
    const tokens = await this.generateTokens(usuario.id_usuario, usuario.email);

    // Actualizar refresh token
    const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
    await this.prisma.usuario.update({
      where: { id_usuario: usuario.id_usuario },
      data: { refresh_token: hashedRefreshToken },
    });

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };
  }

  async logout(userId: number) {
    await this.prisma.usuario.update({
      where: { id_usuario: userId },
      data: { refresh_token: null },
    });

    return {
      message: 'Sesión cerrada exitosamente',
    };
  }

  // MÉTODOS AUXILIARES

  private async generateTokens(userId: number, email: string) {
    const payload = { sub: userId, email };

    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET') || 'default_secret',
      expiresIn: '15m',
    });

    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'default_refresh',
      expiresIn: '7d',
    });

    return { access_token, refresh_token };
  }

  private async createVerificationToken(
    userId: number,
    tipo: string,
    horasExpiracion?: number,
  ): Promise<string> {
    const token = randomBytes(32).toString('hex');
    
    let expiracion: number;
    
    switch (tipo) {
      case 'verificacion_email':
        expiracion = Number(
          this.configService.get('VERIFICATION_TOKEN_EXPIRATION'),
        );
        break;
      case 'recuperar_password':
        expiracion = Number(
          this.configService.get('PASSWORD_RESET_TOKEN_EXPIRATION'),
        );
        break;
      case 'reactivar_cuenta':
        expiracion = Number(
          this.configService.get('REACTIVATION_TOKEN_EXPIRATION'),
        );
        break;
      default:
        expiracion = horasExpiracion || 24;
    }

    const fechaExpira = new Date();
    fechaExpira.setHours(fechaExpira.getHours() + expiracion);

    await this.prisma.tokenVerificacion.create({
      data: {
        id_usuario: userId,
        token,
        tipo,
        fecha_expira: fechaExpira,
      },
    });

    return token;
  }
}
