import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfertaDto } from './dto/create-oferta.dto';
import { CreateContraofertaDto } from './dto/create-contraoferta.dto';

@Injectable()
export class OfertasService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crear una oferta para una ruta
   */
  async create(createOfertaDto: CreateOfertaDto, pasajeroId: number) {
    // Verificar que la ruta existe y está disponible
    const ruta = await this.prisma.ruta.findUnique({
      where: { id_ruta: createOfertaDto.id_ruta },
      include: {
        conductor: true,
      },
    });

    if (!ruta) {
      throw new NotFoundException('Ruta no encontrada');
    }

    // Verificar que el pasajero no sea el conductor
    if (ruta.id_conductor === pasajeroId) {
      throw new BadRequestException('No puedes hacer una oferta en tu propia ruta');
    }

    if (ruta.estado !== 'publicada') {
      throw new BadRequestException('Esta ruta no está disponible para ofertas');
    }

    if (ruta.fecha_salida <= new Date()) {
      throw new BadRequestException('Esta ruta ya ha partido');
    }

    // Verificar que hay asientos disponibles
    if (ruta.asientos_disponibles < createOfertaDto.cantidad_pasajeros) {
      throw new BadRequestException(
        `Solo hay ${ruta.asientos_disponibles} asientos disponibles`,
      );
    }

    // Verificar que el pasajero no tenga una oferta pendiente en esta ruta
    const ofertaExistente = await this.prisma.oferta.findFirst({
      where: {
        id_ruta: createOfertaDto.id_ruta,
        id_pasajero: pasajeroId,
        estado: {
          in: ['pendiente', 'contraoferta'],
        },
      },
    });

    if (ofertaExistente) {
      throw new ConflictException('Ya tienes una oferta pendiente en esta ruta');
    }

    // Crear la oferta
    const oferta = await this.prisma.oferta.create({
      data: {
        id_ruta: createOfertaDto.id_ruta,
        id_pasajero: pasajeroId,
        punto_recogida_lat: createOfertaDto.punto_recogida_lat,
        punto_recogida_lng: createOfertaDto.punto_recogida_lng,
        punto_recogida_direccion: createOfertaDto.punto_recogida_direccion,
        punto_destino_lat: createOfertaDto.punto_destino_lat,
        punto_destino_lng: createOfertaDto.punto_destino_lng,
        punto_destino_direccion: createOfertaDto.punto_destino_direccion,
        cantidad_pasajeros: createOfertaDto.cantidad_pasajeros,
        precio_ofertado: createOfertaDto.precio_ofertado,
        notas_pasajero: createOfertaDto.notas_pasajero,
        fecha_expiracion: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      },
      include: {
        ruta: {
          include: {
            conductor: {
              select: {
                id_usuario: true,
                nombre: true,
                apellido: true,
                nombre_usuario: true,
                foto_perfil: true,
              },
            },
            vehiculo: true,
          },
        },
        pasajero: {
          select: {
            id_usuario: true,
            nombre: true,
            apellido: true,
            nombre_usuario: true,
            foto_perfil: true,
            calificacion_pasajero: true,
          },
        },
      },
    });

    // TODO: Enviar notificación al conductor

    return {
      message: 'Oferta enviada exitosamente',
      oferta,
    };
  }

  /**
   * Listar ofertas (con filtros)
   */
  async findAll(userId: number, tipo: 'pasajero' | 'conductor', page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (tipo === 'pasajero') {
      where.id_pasajero = userId;
    } else if (tipo === 'conductor') {
      where.ruta = {
        id_conductor: userId,
      };
    }

    const [ofertas, total] = await Promise.all([
      this.prisma.oferta.findMany({
        where,
        skip,
        take: limit,
        include: {
          ruta: {
            include: {
              conductor: {
                select: {
                  id_usuario: true,
                  nombre: true,
                  apellido: true,
                  nombre_usuario: true,
                  foto_perfil: true,
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
            },
          },
          pasajero: {
            select: {
              id_usuario: true,
              nombre: true,
              apellido: true,
              nombre_usuario: true,
              foto_perfil: true,
              calificacion_pasajero: true,
            },
          },
          contraofertas: {
            orderBy: {
              fecha_contraoferta: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          fecha_oferta: 'desc',
        },
      }),
      this.prisma.oferta.count({ where }),
    ]);

    return {
      ofertas,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener una oferta por ID
   */
  async findOne(id: number) {
    const oferta = await this.prisma.oferta.findUnique({
      where: { id_oferta: id },
      include: {
        ruta: {
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
            vehiculo: true,
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
        contraofertas: {
          include: {
            conductor: {
              select: {
                id_usuario: true,
                nombre: true,
                apellido: true,
                nombre_usuario: true,
              },
            },
          },
          orderBy: {
            fecha_contraoferta: 'desc',
          },
        },
      },
    });

    if (!oferta) {
      throw new NotFoundException('Oferta no encontrada');
    }

    return oferta;
  }

  /**
   * Aceptar oferta (conductor)
   */
  async acceptOferta(id: number, conductorId: number) {
    const oferta = await this.prisma.oferta.findUnique({
      where: { id_oferta: id },
      include: {
        ruta: true,
      },
    });

    if (!oferta) {
      throw new NotFoundException('Oferta no encontrada');
    }

    if (oferta.ruta.id_conductor !== conductorId) {
      throw new ForbiddenException('No tienes permiso para aceptar esta oferta');
    }

    if (oferta.estado !== 'pendiente' && oferta.estado !== 'contraoferta') {
      throw new BadRequestException('Esta oferta ya ha sido procesada');
    }

    // Verificar que todavía hay asientos disponibles
    if (oferta.ruta.asientos_disponibles < oferta.cantidad_pasajeros) {
      throw new BadRequestException('Ya no hay asientos disponibles');
    }

    // Iniciar transacción
    const result = await this.prisma.$transaction(async (prisma) => {
      // Actualizar oferta
      const ofertaAceptada = await prisma.oferta.update({
        where: { id_oferta: id },
        data: {
          estado: 'aceptada',
        },
      });

      // Crear viaje
      const viaje = await prisma.viaje.create({
        data: {
          id_ruta: oferta.id_ruta,
          id_oferta: id,
          id_conductor: conductorId,
          id_pasajero: oferta.id_pasajero,
          id_vehiculo: oferta.ruta.id_vehiculo,
          precio_final: oferta.precio_ofertado,
          cantidad_pasajeros: oferta.cantidad_pasajeros,
          punto_recogida_lat: oferta.punto_recogida_lat,
          punto_recogida_lng: oferta.punto_recogida_lng,
          punto_recogida_direccion: oferta.punto_recogida_direccion,
          punto_destino_lat: oferta.punto_destino_lat,
          punto_destino_lng: oferta.punto_destino_lng,
          punto_destino_direccion: oferta.punto_destino_direccion,
          fecha_recogida_estimada: oferta.ruta.fecha_salida,
        },
      });

      // Actualizar asientos de la ruta
      await prisma.ruta.update({
        where: { id_ruta: oferta.id_ruta },
        data: {
          asientos_ocupados: {
            increment: oferta.cantidad_pasajeros,
          },
          asientos_disponibles: {
            decrement: oferta.cantidad_pasajeros,
          },
        },
      });

      return { ofertaAceptada, viaje };
    });

    // TODO: Enviar notificación al pasajero

    return {
      message: 'Oferta aceptada exitosamente. Se ha creado el viaje.',
      oferta: result.ofertaAceptada,
      viaje: result.viaje,
    };
  }

  /**
   * Rechazar oferta (conductor)
   */
  async rejectOferta(id: number, conductorId: number) {
    const oferta = await this.prisma.oferta.findUnique({
      where: { id_oferta: id },
      include: {
        ruta: true,
      },
    });

    if (!oferta) {
      throw new NotFoundException('Oferta no encontrada');
    }

    if (oferta.ruta.id_conductor !== conductorId) {
      throw new ForbiddenException('No tienes permiso para rechazar esta oferta');
    }

    if (oferta.estado !== 'pendiente' && oferta.estado !== 'contraoferta') {
      throw new BadRequestException('Esta oferta ya ha sido procesada');
    }

    await this.prisma.oferta.update({
      where: { id_oferta: id },
      data: {
        estado: 'rechazada',
      },
    });

    // TODO: Enviar notificación al pasajero

    return {
      message: 'Oferta rechazada',
    };
  }

  /**
   * Crear contraoferta (conductor)
   */
  async createContraoferta(
    ofertaId: number,
    createContraofertaDto: CreateContraofertaDto,
    conductorId: number,
  ) {
    const oferta = await this.prisma.oferta.findUnique({
      where: { id_oferta: ofertaId },
      include: {
        ruta: true,
      },
    });

    if (!oferta) {
      throw new NotFoundException('Oferta no encontrada');
    }

    if (oferta.ruta.id_conductor !== conductorId) {
      throw new ForbiddenException('No tienes permiso para hacer una contraoferta');
    }

    if (oferta.estado !== 'pendiente') {
      throw new BadRequestException('Solo se pueden hacer contraofertas a ofertas pendientes');
    }

    // Iniciar transacción
    const result = await this.prisma.$transaction(async (prisma) => {
      // Actualizar estado de oferta
      await prisma.oferta.update({
        where: { id_oferta: ofertaId },
        data: {
          estado: 'contraoferta',
        },
      });

      // Crear contraoferta
      const contraoferta = await prisma.contraoferta.create({
        data: {
          id_oferta: ofertaId,
          id_conductor: conductorId,
          precio_contraofertado: createContraofertaDto.precio_contraofertado,
          notas_conductor: createContraofertaDto.notas_conductor,
          fecha_expiracion: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        },
        include: {
          conductor: {
            select: {
              id_usuario: true,
              nombre: true,
              apellido: true,
              nombre_usuario: true,
            },
          },
          oferta: {
            include: {
              pasajero: {
                select: {
                  id_usuario: true,
                  nombre: true,
                  apellido: true,
                },
              },
            },
          },
        },
      });

      return contraoferta;
    });

    // TODO: Enviar notificación al pasajero

    return {
      message: 'Contraoferta enviada exitosamente',
      contraoferta: result,
    };
  }

  /**
   * Aceptar contraoferta (pasajero)
   */
  async acceptContraoferta(contraofertaId: number, pasajeroId: number) {
    const contraoferta = await this.prisma.contraoferta.findUnique({
      where: { id_contraoferta: contraofertaId },
      include: {
        oferta: {
          include: {
            ruta: true,
          },
        },
      },
    });

    if (!contraoferta) {
      throw new NotFoundException('Contraoferta no encontrada');
    }

    if (contraoferta.oferta.id_pasajero !== pasajeroId) {
      throw new ForbiddenException('No tienes permiso para aceptar esta contraoferta');
    }

    if (contraoferta.estado !== 'pendiente') {
      throw new BadRequestException('Esta contraoferta ya ha sido procesada');
    }

    // Verificar asientos disponibles
    if (contraoferta.oferta.ruta.asientos_disponibles < contraoferta.oferta.cantidad_pasajeros) {
      throw new BadRequestException('Ya no hay asientos disponibles');
    }

    // Iniciar transacción
    const result = await this.prisma.$transaction(async (prisma) => {
      // Actualizar contraoferta
      await prisma.contraoferta.update({
        where: { id_contraoferta: contraofertaId },
        data: {
          estado: 'aceptada',
        },
      });

      // Actualizar oferta
      const ofertaActualizada = await prisma.oferta.update({
        where: { id_oferta: contraoferta.id_oferta },
        data: {
          estado: 'aceptada',
          precio_ofertado: contraoferta.precio_contraofertado, // Actualizar con el nuevo precio
        },
      });

      // Crear viaje
      const viaje = await prisma.viaje.create({
        data: {
          id_ruta: contraoferta.oferta.id_ruta,
          id_oferta: contraoferta.id_oferta,
          id_conductor: contraoferta.id_conductor,
          id_pasajero: pasajeroId,
          id_vehiculo: contraoferta.oferta.ruta.id_vehiculo,
          precio_final: contraoferta.precio_contraofertado,
          cantidad_pasajeros: contraoferta.oferta.cantidad_pasajeros,
          punto_recogida_lat: contraoferta.oferta.punto_recogida_lat,
          punto_recogida_lng: contraoferta.oferta.punto_recogida_lng,
          punto_recogida_direccion: contraoferta.oferta.punto_recogida_direccion,
          punto_destino_lat: contraoferta.oferta.punto_destino_lat,
          punto_destino_lng: contraoferta.oferta.punto_destino_lng,
          punto_destino_direccion: contraoferta.oferta.punto_destino_direccion,
          fecha_recogida_estimada: contraoferta.oferta.ruta.fecha_salida,
        },
      });

      // Actualizar asientos de la ruta
      await prisma.ruta.update({
        where: { id_ruta: contraoferta.oferta.id_ruta },
        data: {
          asientos_ocupados: {
            increment: contraoferta.oferta.cantidad_pasajeros,
          },
          asientos_disponibles: {
            decrement: contraoferta.oferta.cantidad_pasajeros,
          },
        },
      });

      return { ofertaActualizada, viaje };
    });

    // TODO: Enviar notificación al conductor

    return {
      message: 'Contraoferta aceptada exitosamente. Se ha creado el viaje.',
      viaje: result.viaje,
    };
  }

  /**
   * Rechazar contraoferta (pasajero)
   */
  async rejectContraoferta(contraofertaId: number, pasajeroId: number) {
    const contraoferta = await this.prisma.contraoferta.findUnique({
      where: { id_contraoferta: contraofertaId },
      include: {
        oferta: true,
      },
    });

    if (!contraoferta) {
      throw new NotFoundException('Contraoferta no encontrada');
    }

    if (contraoferta.oferta.id_pasajero !== pasajeroId) {
      throw new ForbiddenException('No tienes permiso para rechazar esta contraoferta');
    }

    if (contraoferta.estado !== 'pendiente') {
      throw new BadRequestException('Esta contraoferta ya ha sido procesada');
    }

    await this.prisma.$transaction(async (prisma) => {
      // Actualizar contraoferta
      await prisma.contraoferta.update({
        where: { id_contraoferta: contraofertaId },
        data: {
          estado: 'rechazada',
        },
      });

      // Volver oferta a pendiente
      await prisma.oferta.update({
        where: { id_oferta: contraoferta.id_oferta },
        data: {
          estado: 'pendiente',
        },
      });
    });

    // TODO: Enviar notificación al conductor

    return {
      message: 'Contraoferta rechazada. La oferta vuelve a estado pendiente.',
    };
  }
}
