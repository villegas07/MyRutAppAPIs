import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRutaDto } from './dto/create-ruta.dto';
import { UpdateRutaDto } from './dto/update-ruta.dto';
import { SearchRutaDto } from './dto/search-ruta.dto';

@Injectable()
export class RutasService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crear una nueva ruta
   */
  async create(createRutaDto: CreateRutaDto, conductorId: number) {
    // Verificar que el vehículo existe y pertenece al conductor
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { id_vehiculo: createRutaDto.id_vehiculo },
    });

    if (!vehiculo) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    if (vehiculo.id_usuario !== conductorId) {
      throw new ForbiddenException('Este vehículo no te pertenece');
    }

    if (vehiculo.estado !== 'activo') {
      throw new BadRequestException('El vehículo no está activo');
    }

    // Verificar que la fecha de salida sea futura
    const fechaSalida = new Date(createRutaDto.fecha_salida);
    if (fechaSalida <= new Date()) {
      throw new BadRequestException('La fecha de salida debe ser futura');
    }

    // Verificar que los asientos disponibles no excedan la capacidad del vehículo
    if (createRutaDto.asientos_disponibles > vehiculo.capacidad_pasajeros) {
      throw new BadRequestException(
        `Los asientos disponibles no pueden exceder la capacidad del vehículo (${vehiculo.capacidad_pasajeros})`,
      );
    }

    const ruta = await this.prisma.ruta.create({
      data: {
        id_conductor: conductorId,
        id_vehiculo: createRutaDto.id_vehiculo,
        origen_lat: createRutaDto.origen_lat,
        origen_lng: createRutaDto.origen_lng,
        origen_direccion: createRutaDto.origen_direccion,
        destino_lat: createRutaDto.destino_lat,
        destino_lng: createRutaDto.destino_lng,
        destino_direccion: createRutaDto.destino_direccion,
        fecha_salida: new Date(createRutaDto.fecha_salida),
        precio_sugerido: createRutaDto.precio_sugerido,
        asientos_disponibles: createRutaDto.asientos_disponibles,
        distancia_km: createRutaDto.distancia_km,
        duracion_estimada: createRutaDto.duracion_estimada,
        permite_equipaje: createRutaDto.permite_equipaje ?? true,
        permite_mascotas: createRutaDto.permite_mascotas ?? false,
        notas_adicionales: createRutaDto.notas_adicionales,
      },
      include: {
        conductor: {
          select: {
            id_usuario: true,
            nombre: true,
            apellido: true,
            nombre_usuario: true,
            foto_perfil: true,
            calificacion_conductor: true,
            total_viajes_conductor: true,
          },
        },
        vehiculo: {
          select: {
            id_vehiculo: true,
            marca: true,
            modelo: true,
            color: true,
            placa: true,
            tipo_vehiculo: true,
            foto_vehiculo: true,
          },
        },
      },
    });

    return {
      message: 'Ruta publicada exitosamente',
      ruta,
    };
  }

  /**
   * Buscar rutas con filtros GPS
   */
  async search(searchDto: SearchRutaDto, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const radioBusqueda = searchDto.radio_busqueda || 5; // 5km por defecto

    // Construir filtros
    const where: any = {
      estado: 'publicada',
      fecha_salida: {
        gte: new Date(), // Solo rutas futuras
      },
    };

    if (searchDto.asientos_requeridos) {
      where.asientos_disponibles = {
        gte: searchDto.asientos_requeridos,
      };
    }

    if (searchDto.precio_maximo) {
      where.precio_sugerido = {
        lte: searchDto.precio_maximo,
      };
    }

    if (searchDto.permite_equipaje === 'true') {
      where.permite_equipaje = true;
    }

    if (searchDto.permite_mascotas === 'true') {
      where.permite_mascotas = true;
    }

    if (searchDto.fecha_salida) {
      const fechaBuscada = new Date(searchDto.fecha_salida);
      const inicioDia = new Date(fechaBuscada.setHours(0, 0, 0, 0));
      const finDia = new Date(fechaBuscada.setHours(23, 59, 59, 999));
      
      where.fecha_salida = {
        gte: inicioDia,
        lte: finDia,
      };
    }

    // Obtener todas las rutas que cumplen los filtros básicos
    let rutas = await this.prisma.ruta.findMany({
      where,
      include: {
        conductor: {
          select: {
            id_usuario: true,
            nombre: true,
            apellido: true,
            nombre_usuario: true,
            foto_perfil: true,
            calificacion_conductor: true,
            total_viajes_conductor: true,
          },
        },
        vehiculo: {
          select: {
            id_vehiculo: true,
            marca: true,
            modelo: true,
            color: true,
            placa: true,
            tipo_vehiculo: true,
            foto_vehiculo: true,
            capacidad_pasajeros: true,
          },
        },
        _count: {
          select: {
            ofertas: true,
          },
        },
      },
      orderBy: {
        fecha_salida: 'asc',
      },
    });

    // Filtrar por proximidad GPS si se proporcionaron coordenadas
    if (searchDto.origen_lat && searchDto.origen_lng) {
      rutas = rutas.filter((ruta) => {
        const distanciaOrigen = this.calcularDistancia(
          searchDto.origen_lat!,
          searchDto.origen_lng!,
          Number(ruta.origen_lat),
          Number(ruta.origen_lng),
        );
        return distanciaOrigen <= radioBusqueda;
      });
    }

    if (searchDto.destino_lat && searchDto.destino_lng) {
      rutas = rutas.filter((ruta) => {
        const distanciaDestino = this.calcularDistancia(
          searchDto.destino_lat!,
          searchDto.destino_lng!,
          Number(ruta.destino_lat),
          Number(ruta.destino_lng),
        );
        return distanciaDestino <= radioBusqueda;
      });
    }

    const total = rutas.length;
    const rutasPaginadas = rutas.slice(skip, skip + limit);

    return {
      rutas: rutasPaginadas,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener todas las rutas (con filtros opcionales)
   */
  async findAll(conductorId?: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (conductorId) {
      where.id_conductor = conductorId;
    }

    const [rutas, total] = await Promise.all([
      this.prisma.ruta.findMany({
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
              calificacion_conductor: true,
            },
          },
          vehiculo: {
            select: {
              id_vehiculo: true,
              marca: true,
              modelo: true,
              color: true,
              placa: true,
              tipo_vehiculo: true,
            },
          },
          _count: {
            select: {
              ofertas: true,
              viajes: true,
            },
          },
        },
        orderBy: {
          fecha_publicacion: 'desc',
        },
      }),
      this.prisma.ruta.count({ where }),
    ]);

    return {
      rutas,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener una ruta por ID
   */
  async findOne(id: number) {
    const ruta = await this.prisma.ruta.findUnique({
      where: { id_ruta: id },
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
            total_viajes_conductor: true,
            verificado: true,
          },
        },
        vehiculo: {
          select: {
            id_vehiculo: true,
            marca: true,
            modelo: true,
            anio: true,
            color: true,
            placa: true,
            tipo_vehiculo: true,
            foto_vehiculo: true,
            capacidad_pasajeros: true,
          },
        },
        ofertas: {
          include: {
            pasajero: {
              select: {
                id_usuario: true,
                nombre: true,
                apellido: true,
                nombre_usuario: true,
                foto_perfil: true,
              },
            },
          },
          orderBy: {
            fecha_oferta: 'desc',
          },
        },
        viajes: {
          include: {
            pasajero: {
              select: {
                id_usuario: true,
                nombre: true,
                apellido: true,
                nombre_usuario: true,
              },
            },
          },
        },
      },
    });

    if (!ruta) {
      throw new NotFoundException('Ruta no encontrada');
    }

    return ruta;
  }

  /**
   * Actualizar una ruta
   */
  async update(id: number, updateRutaDto: UpdateRutaDto, conductorId: number) {
    const ruta = await this.prisma.ruta.findUnique({
      where: { id_ruta: id },
    });

    if (!ruta) {
      throw new NotFoundException('Ruta no encontrada');
    }

    if (ruta.id_conductor !== conductorId) {
      throw new ForbiddenException('No tienes permiso para actualizar esta ruta');
    }

    if (ruta.estado === 'completada' || ruta.estado === 'cancelada') {
      throw new BadRequestException('No se puede actualizar una ruta completada o cancelada');
    }

    // Validar fecha de salida si se está actualizando
    if (updateRutaDto.fecha_salida) {
      const nuevaFecha = new Date(updateRutaDto.fecha_salida);
      if (nuevaFecha <= new Date()) {
        throw new BadRequestException('La fecha de salida debe ser futura');
      }
    }

    const rutaActualizada = await this.prisma.ruta.update({
      where: { id_ruta: id },
      data: {
        ...updateRutaDto,
        fecha_salida: updateRutaDto.fecha_salida ? new Date(updateRutaDto.fecha_salida) : undefined,
        fecha_actualizacion: new Date(),
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
        vehiculo: true,
      },
    });

    return {
      message: 'Ruta actualizada exitosamente',
      ruta: rutaActualizada,
    };
  }

  /**
   * Cancelar una ruta
   */
  async remove(id: number, conductorId: number) {
    const ruta = await this.prisma.ruta.findUnique({
      where: { id_ruta: id },
      include: {
        viajes: true,
      },
    });

    if (!ruta) {
      throw new NotFoundException('Ruta no encontrada');
    }

    if (ruta.id_conductor !== conductorId) {
      throw new ForbiddenException('No tienes permiso para cancelar esta ruta');
    }

    if (ruta.estado === 'completada') {
      throw new BadRequestException('No se puede cancelar una ruta completada');
    }

    // Verificar si hay viajes confirmados
    const viajesConfirmados = ruta.viajes.filter(
      (viaje) => viaje.estado === 'confirmado' || viaje.estado === 'en_curso',
    );

    if (viajesConfirmados.length > 0) {
      throw new BadRequestException(
        'No se puede cancelar la ruta porque tiene viajes confirmados. Contacta a los pasajeros primero.',
      );
    }

    await this.prisma.ruta.update({
      where: { id_ruta: id },
      data: {
        estado: 'cancelada',
        fecha_actualizacion: new Date(),
      },
    });

    return {
      message: 'Ruta cancelada exitosamente',
    };
  }

  /**
   * Calcular distancia entre dos puntos GPS (fórmula de Haversine)
   */
  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c;
    return distancia;
  }

  private toRad(valor: number): number {
    return (valor * Math.PI) / 180;
  }
}
