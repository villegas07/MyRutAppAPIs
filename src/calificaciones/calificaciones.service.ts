import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCalificacionDto } from './dto/create-calificacion.dto';

@Injectable()
export class CalificacionesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crear una calificación
   */
  async create(createCalificacionDto: CreateCalificacionDto, calificadorId: number) {
    // Verificar que el viaje existe y está completado
    const viaje = await this.prisma.viaje.findUnique({
      where: { id_viaje: createCalificacionDto.id_viaje },
      include: {
        calificaciones: true,
      },
    });

    if (!viaje) {
      throw new NotFoundException('Viaje no encontrado');
    }

    if (viaje.estado !== 'completado') {
      throw new BadRequestException('Solo se pueden calificar viajes completados');
    }

    // Verificar que el usuario sea parte del viaje
    if (viaje.id_conductor !== calificadorId && viaje.id_pasajero !== calificadorId) {
      throw new ForbiddenException('No puedes calificar este viaje');
    }

    // Determinar quién califica a quién
    const esConductor = viaje.id_conductor === calificadorId;
    const calificadoId = esConductor ? viaje.id_pasajero : viaje.id_conductor;
    const tipo = esConductor ? 'conductor_a_pasajero' : 'pasajero_a_conductor';

    // Verificar que no haya calificado ya
    const calificacionExistente = viaje.calificaciones.find(
      c => c.id_evaluador === calificadorId && c.id_evaluado === calificadoId
    );

    if (calificacionExistente) {
      throw new ConflictException('Ya has calificado este viaje');
    }

    // Iniciar transacción
    const result = await this.prisma.$transaction(async (prisma) => {
      // Crear calificación
      const calificacion = await prisma.calificacion.create({
        data: {
          id_viaje: createCalificacionDto.id_viaje,
          id_evaluador: calificadorId,
          id_evaluado: calificadoId,
          puntuacion: createCalificacionDto.puntuacion,
          comentario: createCalificacionDto.comentario,
          tipo_evaluacion: tipo,
        },
        include: {
          evaluador: {
            select: {
              id_usuario: true,
              nombre: true,
              apellido: true,
              foto_perfil: true,
            },
          },
          evaluado: {
            select: {
              id_usuario: true,
              nombre: true,
              apellido: true,
              foto_perfil: true,
            },
          },
        },
      });

      // Actualizar promedio de calificación del usuario calificado
      if (esConductor) {
        // Actualizando calificación del pasajero
        const calificaciones = await prisma.calificacion.findMany({
          where: {
            id_evaluado: calificadoId,
            tipo_evaluacion: 'conductor_a_pasajero',
          },
          select: {
            puntuacion: true,
          },
        });

        const promedio = calificaciones.reduce((sum, c) => sum + c.puntuacion, 0) / calificaciones.length;

        await prisma.usuario.update({
          where: { id_usuario: calificadoId },
          data: {
            calificacion_pasajero: promedio,
          },
        });
      } else {
        // Actualizando calificación del conductor
        const calificaciones = await prisma.calificacion.findMany({
          where: {
            id_evaluado: calificadoId,
            tipo_evaluacion: 'pasajero_a_conductor',
          },
          select: {
            puntuacion: true,
          },
        });

        const promedio = calificaciones.reduce((sum, c) => sum + c.puntuacion, 0) / calificaciones.length;

        await prisma.usuario.update({
          where: { id_usuario: calificadoId },
          data: {
            calificacion_conductor: promedio,
          },
        });
      }

      return calificacion;
    });

    // TODO: Enviar notificación al usuario calificado

    return {
      message: 'Calificación creada exitosamente',
      calificacion: result,
    };
  }

  /**
   * Obtener calificaciones de un usuario
   */
  async findByUsuario(usuarioId: number, tipo: 'conductor' | 'pasajero', page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const tipoCalificacion = tipo === 'conductor' ? 'pasajero_a_conductor' : 'conductor_a_pasajero';

    const [calificaciones, total] = await Promise.all([
      this.prisma.calificacion.findMany({
        where: {
          id_evaluado: usuarioId,
          tipo_evaluacion: tipoCalificacion,
        },
        skip,
        take: limit,
        include: {
          evaluador: {
            select: {
              id_usuario: true,
              nombre: true,
              apellido: true,
              nombre_usuario: true,
              foto_perfil: true,
            },
          },
          viaje: {
            select: {
              id_viaje: true,
              fecha_llegada_real: true,
            },
          },
        },
        orderBy: {
          fecha_calificacion: 'desc',
        },
      }),
      this.prisma.calificacion.count({
        where: {
          id_evaluado: usuarioId,
          tipo_evaluacion: tipoCalificacion,
        },
      }),
    ]);

    // Calcular promedio
    const promedio = calificaciones.length > 0
      ? calificaciones.reduce((sum, c) => sum + c.puntuacion, 0) / calificaciones.length
      : 0;

    return {
      calificaciones,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      promedio: Math.round(promedio * 10) / 10, // Redondear a 1 decimal
    };
  }

  /**
   * Obtener calificaciones de un viaje específico
   */
  async findByViaje(viajeId: number) {
    const calificaciones = await this.prisma.calificacion.findMany({
      where: {
        id_viaje: viajeId,
      },
      include: {
        evaluador: {
          select: {
            id_usuario: true,
            nombre: true,
            apellido: true,
            nombre_usuario: true,
            foto_perfil: true,
          },
        },
        evaluado: {
          select: {
            id_usuario: true,
            nombre: true,
            apellido: true,
            nombre_usuario: true,
            foto_perfil: true,
          },
        },
      },
    });

    return {
      calificaciones,
      total: calificaciones.length,
    };
  }

  /**
   * Obtener estadísticas de calificaciones de un usuario
   */
  async getEstadisticas(usuarioId: number, tipo: 'conductor' | 'pasajero') {
    const tipoCalificacion = tipo === 'conductor' ? 'pasajero_a_conductor' : 'conductor_a_pasajero';

    const calificaciones = await this.prisma.calificacion.findMany({
      where: {
        id_evaluado: usuarioId,
        tipo_evaluacion: tipoCalificacion,
      },
      select: {
        puntuacion: true,
      },
    });

    if (calificaciones.length === 0) {
      return {
        total_calificaciones: 0,
        promedio: 0,
        distribucion: {
          '5_estrellas': 0,
          '4_estrellas': 0,
          '3_estrellas': 0,
          '2_estrellas': 0,
          '1_estrella': 0,
        },
      };
    }

    const total = calificaciones.length;
    const promedio = calificaciones.reduce((sum, c) => sum + c.puntuacion, 0) / total;

    const distribucion = {
      '5_estrellas': calificaciones.filter(c => c.puntuacion === 5).length,
      '4_estrellas': calificaciones.filter(c => c.puntuacion === 4).length,
      '3_estrellas': calificaciones.filter(c => c.puntuacion === 3).length,
      '2_estrellas': calificaciones.filter(c => c.puntuacion === 2).length,
      '1_estrella': calificaciones.filter(c => c.puntuacion === 1).length,
    };

    return {
      total_calificaciones: total,
      promedio: Math.round(promedio * 10) / 10,
      distribucion,
    };
  }
}
