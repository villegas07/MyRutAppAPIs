import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  // Obtener todos los usuarios con paginación
  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' as const } },
            { apellido: { contains: search, mode: 'insensitive' as const } },
            { nombre_usuario: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [usuarios, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        select: {
          id_usuario: true,
          nombre: true,
          apellido: true,
          nombre_usuario: true,
          email: true,
          telefono: true,
          foto_perfil: true,
          rol: true,
          fecha_registro: true,
          fecha_nacimiento: true,
          calificacion_conductor: true,
          calificacion_pasajero: true,
          total_viajes_conductor: true,
          total_viajes_pasajero: true,
          estado_cuenta: true,
          verificado: true,
          ultimo_acceso: true,
        },
        orderBy: { fecha_registro: 'desc' },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return {
      data: usuarios,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Obtener usuario por ID
  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: id },
      select: {
        id_usuario: true,
        nombre: true,
        apellido: true,
        nombre_usuario: true,
        email: true,
        telefono: true,
        foto_perfil: true,
        rol: true,
        fecha_registro: true,
        fecha_nacimiento: true,
        calificacion_conductor: true,
        calificacion_pasajero: true,
        total_viajes_conductor: true,
        total_viajes_pasajero: true,
        estado_cuenta: true,
        verificado: true,
        ultimo_acceso: true,
        // Incluir relaciones
        vehiculos: {
          select: {
            id_vehiculo: true,
            placa: true,
            marca: true,
            modelo: true,
            anio: true,
            color: true,
            capacidad_pasajeros: true,
            foto_vehiculo: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  // Obtener perfil público por nombre de usuario
  async findByUsername(username: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { nombre_usuario: username },
      select: {
        id_usuario: true,
        nombre: true,
        apellido: true,
        nombre_usuario: true,
        foto_perfil: true,
        fecha_registro: true,
        calificacion_conductor: true,
        calificacion_pasajero: true,
        total_viajes_conductor: true,
        total_viajes_pasajero: true,
        verificado: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  // Actualizar perfil de usuario
  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    // Verificar que el usuario existe
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: id },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar si el email ya está en uso por otro usuario
    if (updateUsuarioDto.email && updateUsuarioDto.email !== usuario.email) {
      const emailExists = await this.prisma.usuario.findUnique({
        where: { email: updateUsuarioDto.email },
      });

      if (emailExists) {
        throw new ConflictException('El email ya está en uso');
      }
    }

    // Verificar si el nombre de usuario ya está en uso
    if (updateUsuarioDto.nombre_usuario && updateUsuarioDto.nombre_usuario !== usuario.nombre_usuario) {
      const usernameExists = await this.prisma.usuario.findUnique({
        where: { nombre_usuario: updateUsuarioDto.nombre_usuario },
      });

      if (usernameExists) {
        throw new ConflictException('El nombre de usuario ya está en uso');
      }
    }

    // Actualizar usuario
    const usuarioActualizado = await this.prisma.usuario.update({
      where: { id_usuario: id },
      data: {
        ...updateUsuarioDto,
        fecha_nacimiento: updateUsuarioDto.fecha_nacimiento
          ? new Date(updateUsuarioDto.fecha_nacimiento)
          : undefined,
      },
      select: {
        id_usuario: true,
        nombre: true,
        apellido: true,
        nombre_usuario: true,
        email: true,
        telefono: true,
        foto_perfil: true,
        fecha_nacimiento: true,
        rol: true,
        verificado: true,
      },
    });

    return {
      message: 'Perfil actualizado exitosamente',
      usuario: usuarioActualizado,
    };
  }

  // Actualizar foto de perfil
  async updateFotoPerfil(id: number, fotoUrl: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: id },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const usuarioActualizado = await this.prisma.usuario.update({
      where: { id_usuario: id },
      data: { foto_perfil: fotoUrl },
      select: {
        id_usuario: true,
        nombre: true,
        apellido: true,
        nombre_usuario: true,
        email: true,
        foto_perfil: true,
      },
    });

    return {
      message: 'Foto de perfil actualizada exitosamente',
      usuario: usuarioActualizado,
    };
  }

  // Eliminar foto de perfil
  async deleteFotoPerfil(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: id },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.prisma.usuario.update({
      where: { id_usuario: id },
      data: { foto_perfil: null },
    });

    return {
      message: 'Foto de perfil eliminada exitosamente',
    };
  }

  // Cambiar contraseña
  async changePassword(id: number, changePasswordDto: ChangePasswordDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: id },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.password_actual,
      usuario.password_hash,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(changePasswordDto.password_nueva, 10);

    // Actualizar contraseña
    await this.prisma.usuario.update({
      where: { id_usuario: id },
      data: { password_hash: hashedPassword },
    });

    return {
      message: 'Contraseña actualizada exitosamente',
    };
  }

  // Eliminar usuario (soft delete)
  async remove(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: id },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Desactivar cuenta en lugar de eliminar
    await this.prisma.usuario.update({
      where: { id_usuario: id },
      data: { estado_cuenta: 'inactivo' },
    });

    return {
      message: 'Usuario desactivado exitosamente',
    };
  }

  // Obtener estadísticas del usuario
  async getStats(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: id },
      select: {
        id_usuario: true,
        nombre: true,
        apellido: true,
        nombre_usuario: true,
        foto_perfil: true,
        calificacion_conductor: true,
        calificacion_pasajero: true,
        total_viajes_conductor: true,
        total_viajes_pasajero: true,
        fecha_registro: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Obtener estadísticas adicionales
    const [
      totalRutas,
      totalOfertas,
      totalCalificacionesRecibidas,
      totalVehículos,
    ] = await Promise.all([
      this.prisma.ruta.count({
        where: { id_conductor: id },
      }),
      this.prisma.oferta.count({
        where: { id_pasajero: id },
      }),
      this.prisma.calificacion.count({
        where: { id_evaluado: id },
      }),
      this.prisma.vehiculo.count({
        where: { id_usuario: id },
      }),
    ]);

    return {
      ...usuario,
      estadisticas: {
        total_rutas_publicadas: totalRutas,
        total_ofertas_realizadas: totalOfertas,
        total_calificaciones_recibidas: totalCalificacionesRecibidas,
        total_vehiculos: totalVehículos,
      },
    };
  }
}
