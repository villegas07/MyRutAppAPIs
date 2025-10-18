import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IniciarViajeDto } from './dto/iniciar-viaje.dto';
import { FinalizarViajeDto } from './dto/finalizar-viaje.dto';
import { UpdateUbicacionDto } from './dto/update-ubicacion.dto';
import { CancelarViajeDto } from './dto/cancelar-viaje.dto';

@Injectable()
export class ViajesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generar código de verificación de 6 dígitos
   */
  private generarCodigoVerificacion(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Obtener todos los viajes del usuario (como conductor o pasajero)
   */
  async findAll(userId: number, rol: 'conductor' | 'pasajero', page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const where: any = rol === 'conductor' 
      ? { id_conductor: userId }
      : { id_pasajero: userId };

    const [viajes, total] = await Promise.all([
      this.prisma.viaje.findMany({
        where,
        skip,
        take: limit,
        include: {
          conductor: {
            select: {
              id_usuario: true,
              nombre: true,
              apellido: true,
              nombre_usuario: true,
              foto_perfil: true,
              telefono: true,
              calificacion_conductor: true,
            },
          },
          pasajero: {
            select: {
              id_usuario: true,
              nombre: true,
              apellido: true,
              nombre_usuario: true,
              foto_perfil: true,
              telefono: true,
              calificacion_pasajero: true,
            },
          },
          vehiculo: {
            select: {
              marca: true,
              modelo: true,
              color: true,
              placa: true,
              tipo_vehiculo: true,
            },
          },
          ruta: {
            select: {
              origen_lat: true,
              origen_lng: true,
              origen_direccion: true,
              destino_lat: true,
              destino_lng: true,
              destino_direccion: true,
            },
          },
          pagos: true,
        },
        orderBy: {
          fecha_confirmacion: 'desc',
        },
      }),
      this.prisma.viaje.count({ where }),
    ]);

    return {
      viajes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener detalle de un viaje
   */
  async findOne(id: number, userId: number) {
    const viaje = await this.prisma.viaje.findUnique({
      where: { id_viaje: id },
      include: {
        conductor: {
          select: {
            id_usuario: true,
            nombre: true,
            apellido: true,
            nombre_usuario: true,
            foto_perfil: true,
            telefono: true,
            calificacion_conductor: true,
          },
        },
        pasajero: {
          select: {
            id_usuario: true,
            nombre: true,
            apellido: true,
            nombre_usuario: true,
            foto_perfil: true,
            telefono: true,
            calificacion_pasajero: true,
          },
        },
        vehiculo: true,
        ruta: true,
        oferta: true,
        pagos: true,
        calificaciones: true,
      },
    });

    if (!viaje) {
      throw new NotFoundException('Viaje no encontrado');
    }

    // Verificar que el usuario sea parte del viaje
    if (viaje.id_conductor !== userId && viaje.id_pasajero !== userId) {
      throw new ForbiddenException('No tienes acceso a este viaje');
    }

    return viaje;
  }

  /**
   * Iniciar viaje (conductor verifica código del pasajero)
   */
  async iniciarViaje(id: number, iniciarViajeDto: IniciarViajeDto, conductorId: number) {
    const viaje = await this.prisma.viaje.findUnique({
      where: { id_viaje: id },
      include: {
        ruta: true,
      },
    });

    if (!viaje) {
      throw new NotFoundException('Viaje no encontrado');
    }

    if (viaje.id_conductor !== conductorId) {
      throw new ForbiddenException('Solo el conductor puede iniciar el viaje');
    }

    if (viaje.estado !== 'confirmado') {
      throw new BadRequestException(`No se puede iniciar un viaje en estado: ${viaje.estado}`);
    }

    if (viaje.codigo_verificacion_inicio !== iniciarViajeDto.codigo_verificacion) {
      throw new BadRequestException('Código de verificación incorrecto');
    }

    // Verificar que la fecha del viaje es hoy o en el pasado
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (viaje.fecha_recogida_estimada > hoy) {
      throw new BadRequestException('El viaje aún no puede ser iniciado');
    }

    const viajeIniciado = await this.prisma.viaje.update({
      where: { id_viaje: id },
      data: {
        estado: 'en_curso',
        fecha_inicio_real: new Date(),
      },
      include: {
        conductor: {
          select: {
            id_usuario: true,
            nombre: true,
            apellido: true,
          },
        },
        pasajero: {
          select: {
            id_usuario: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    // Actualizar estado de la ruta a 'en_curso' si no lo está
    await this.prisma.ruta.update({
      where: { id_ruta: viaje.id_ruta },
      data: {
        estado: 'en_curso',
      },
    });

    // TODO: Enviar notificación al pasajero

    return {
      message: 'Viaje iniciado exitosamente',
      viaje: viajeIniciado,
    };
  }

  /**
   * Actualizar ubicación del conductor en tiempo real
   */
  async updateUbicacion(id: number, updateUbicacionDto: UpdateUbicacionDto, conductorId: number) {
    const viaje = await this.prisma.viaje.findUnique({
      where: { id_viaje: id },
    });

    if (!viaje) {
      throw new NotFoundException('Viaje no encontrado');
    }

    if (viaje.id_conductor !== conductorId) {
      throw new ForbiddenException('Solo el conductor puede actualizar la ubicación');
    }

    if (viaje.estado !== 'en_curso') {
      throw new BadRequestException('Solo se puede actualizar ubicación en viajes en curso');
    }

    const viajeActualizado = await this.prisma.viaje.update({
      where: { id_viaje: id },
      data: {
        latitud_actual: updateUbicacionDto.latitud_actual,
        longitud_actual: updateUbicacionDto.longitud_actual,
      },
    });

    // TODO: Enviar ubicación por WebSocket al pasajero

    return {
      message: 'Ubicación actualizada',
      latitud: viajeActualizado.latitud_actual,
      longitud: viajeActualizado.longitud_actual,
    };
  }

  /**
   * Finalizar viaje (pasajero verifica código del conductor)
   */
  async finalizarViaje(id: number, finalizarViajeDto: FinalizarViajeDto, pasajeroId: number) {
    const viaje = await this.prisma.viaje.findUnique({
      where: { id_viaje: id },
      include: {
        ruta: true,
      },
    });

    if (!viaje) {
      throw new NotFoundException('Viaje no encontrado');
    }

    if (viaje.id_pasajero !== pasajeroId) {
      throw new ForbiddenException('Solo el pasajero puede finalizar el viaje');
    }

    if (viaje.estado !== 'en_curso') {
      throw new BadRequestException(`No se puede finalizar un viaje en estado: ${viaje.estado}`);
    }

    if (viaje.codigo_verificacion_fin !== finalizarViajeDto.codigo_verificacion) {
      throw new BadRequestException('Código de verificación incorrecto');
    }

    const viajeFinalizado = await this.prisma.viaje.update({
      where: { id_viaje: id },
      data: {
        estado: 'completado',
        fecha_fin_real: new Date(),
      },
      include: {
        conductor: {
          select: {
            id_usuario: true,
            nombre: true,
            apellido: true,
          },
        },
        pasajero: {
          select: {
            id_usuario: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    // Verificar si todos los viajes de la ruta están completados o cancelados
    const viajesRuta = await this.prisma.viaje.findMany({
      where: { id_ruta: viaje.id_ruta },
    });

    const todosFinalizados = viajesRuta.every(
      v => v.estado === 'completado' || v.estado === 'cancelado'
    );

    if (todosFinalizados) {
      await this.prisma.ruta.update({
        where: { id_ruta: viaje.id_ruta },
        data: {
          estado: 'completada',
        },
      });
    }

    // TODO: Enviar notificación a conductor y pasajero
    // TODO: Procesar pago automáticamente

    return {
      message: 'Viaje finalizado exitosamente. ¡Ahora pueden calificarse mutuamente!',
      viaje: viajeFinalizado,
    };
  }

  /**
   * Cancelar viaje
   */
  async cancelarViaje(id: number, cancelarViajeDto: CancelarViajeDto, userId: number) {
    const viaje = await this.prisma.viaje.findUnique({
      where: { id_viaje: id },
      include: {
        ruta: true,
        pagos: true,
      },
    });

    if (!viaje) {
      throw new NotFoundException('Viaje no encontrado');
    }

    // Verificar que el usuario sea parte del viaje
    if (viaje.id_conductor !== userId && viaje.id_pasajero !== userId) {
      throw new ForbiddenException('No tienes permiso para cancelar este viaje');
    }

    if (viaje.estado === 'completado') {
      throw new BadRequestException('No se puede cancelar un viaje completado');
    }

    if (viaje.estado === 'cancelado') {
      throw new BadRequestException('Este viaje ya está cancelado');
    }

    // Determinar quién canceló
    const canceladoPor = viaje.id_conductor === userId ? 'conductor' : 'pasajero';

    // Iniciar transacción
    const result = await this.prisma.$transaction(async (prisma) => {
      // Actualizar viaje
      const viajeCancelado = await prisma.viaje.update({
        where: { id_viaje: id },
        data: {
          estado: 'cancelado',
          motivo_cancelacion: cancelarViajeDto.motivo_cancelacion,
          cancelado_por: canceladoPor,
          fecha_cancelacion: new Date(),
        },
      });

      // Devolver asientos a la ruta
      await prisma.ruta.update({
        where: { id_ruta: viaje.id_ruta },
        data: {
          asientos_disponibles: {
            increment: viaje.cantidad_pasajeros,
          },
          asientos_ocupados: {
            decrement: viaje.cantidad_pasajeros,
          },
        },
      });

      // Si hay pagos, marcarlos como reembolsados
      if (viaje.pagos && viaje.pagos.length > 0) {
        await Promise.all(
          viaje.pagos.map(pago =>
            prisma.pago.update({
              where: { id_pago: pago.id_pago },
              data: {
                estado: 'reembolsado',
              },
            })
          )
        );
      }

      return viajeCancelado;
    });

    // TODO: Enviar notificación a la otra parte
    // TODO: Procesar reembolso si aplica

    return {
      message: 'Viaje cancelado exitosamente',
      viaje: result,
    };
  }

  /**
   * Obtener ubicación actual del conductor (para pasajero)
   */
  async getUbicacionConductor(id: number, pasajeroId: number) {
    const viaje = await this.prisma.viaje.findUnique({
      where: { id_viaje: id },
      select: {
        id_viaje: true,
        id_pasajero: true,
        estado: true,
        latitud_actual: true,
        longitud_actual: true,
      },
    });

    if (!viaje) {
      throw new NotFoundException('Viaje no encontrado');
    }

    if (viaje.id_pasajero !== pasajeroId) {
      throw new ForbiddenException('Solo el pasajero del viaje puede ver la ubicación');
    }

    if (viaje.estado !== 'en_curso') {
      throw new BadRequestException('Solo se puede rastrear viajes en curso');
    }

    if (!viaje.latitud_actual || !viaje.longitud_actual) {
      return {
        message: 'El conductor aún no ha compartido su ubicación',
        ubicacion: null,
      };
    }

    return {
      latitud: viaje.latitud_actual,
      longitud: viaje.longitud_actual,
    };
  }

  /**
   * Obtener historial de viajes completados
   */
  async getHistorial(userId: number, rol: 'conductor' | 'pasajero', page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where: any = {
      estado: 'completado',
    };

    if (rol === 'conductor') {
      where.id_conductor = userId;
    } else {
      where.id_pasajero = userId;
    }

    const [viajes, total] = await Promise.all([
      this.prisma.viaje.findMany({
        where,
        skip,
        take: limit,
        include: {
          conductor: {
            select: {
              nombre: true,
              apellido: true,
              foto_perfil: true,
            },
          },
          pasajero: {
            select: {
              nombre: true,
              apellido: true,
              foto_perfil: true,
            },
          },
          calificaciones: true,
        },
        orderBy: {
          fecha_fin_real: 'desc',
        },
      }),
      this.prisma.viaje.count({ where }),
    ]);

    return {
      viajes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
