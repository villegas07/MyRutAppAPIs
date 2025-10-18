import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';

@Injectable()
export class VehiculosService {
  constructor(private prisma: PrismaService) {}

  async create(createVehiculoDto: CreateVehiculoDto, userId: number) {
    // Verificar si la placa ya existe
    const placaExiste = await this.prisma.vehiculo.findUnique({
      where: { placa: createVehiculoDto.placa },
    });

    if (placaExiste) {
      throw new ConflictException('La placa ya está registrada');
    }

    const vehiculo = await this.prisma.vehiculo.create({
      data: {
        ...createVehiculoDto,
        id_usuario: userId,
        fecha_actualizacion: new Date(),
      },
      include: {
        usuario: {
          select: {
            id_usuario: true,
            nombre: true,
            apellido: true,
            nombre_usuario: true,
          },
        },
      },
    });

    return {
      message: 'Vehículo registrado exitosamente',
      vehiculo,
    };
  }

  async findAll(userId?: number) {
    const where = userId ? { id_usuario: userId } : {};

    const vehiculos = await this.prisma.vehiculo.findMany({
      where,
      include: {
        usuario: {
          select: {
            id_usuario: true,
            nombre: true,
            apellido: true,
            nombre_usuario: true,
            foto_perfil: true,
          },
        },
      },
      orderBy: { fecha_registro: 'desc' },
    });

    return vehiculos;
  }

  async findOne(id: number) {
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { id_vehiculo: id },
      include: {
        usuario: {
          select: {
            id_usuario: true,
            nombre: true,
            apellido: true,
            nombre_usuario: true,
            email: true,
            telefono: true,
            foto_perfil: true,
            calificacion_conductor: true,
          },
        },
        rutas: {
          where: {
            fecha_salida: {
              gte: new Date(),
            },
          },
          orderBy: { fecha_salida: 'asc' },
          take: 5,
        },
      },
    });

    if (!vehiculo) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    return vehiculo;
  }

  async update(id: number, updateVehiculoDto: UpdateVehiculoDto, userId: number) {
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { id_vehiculo: id },
    });

    if (!vehiculo) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    if (vehiculo.id_usuario !== userId) {
      throw new ForbiddenException('No tienes permiso para actualizar este vehículo');
    }

    // Verificar si la nueva placa ya existe
    if (updateVehiculoDto.placa && updateVehiculoDto.placa !== vehiculo.placa) {
      const placaExiste = await this.prisma.vehiculo.findUnique({
        where: { placa: updateVehiculoDto.placa },
      });

      if (placaExiste) {
        throw new ConflictException('La placa ya está registrada');
      }
    }

    const vehiculoActualizado = await this.prisma.vehiculo.update({
      where: { id_vehiculo: id },
      data: updateVehiculoDto,
    });

    return {
      message: 'Vehículo actualizado exitosamente',
      vehiculo: vehiculoActualizado,
    };
  }

  async remove(id: number, userId: number) {
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { id_vehiculo: id },
    });

    if (!vehiculo) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    if (vehiculo.id_usuario !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar este vehículo');
    }

    // Verificar si tiene rutas activas
    const rutasActivas = await this.prisma.ruta.count({
      where: {
        id_vehiculo: id,
        fecha_salida: {
          gte: new Date(),
        },
      },
    });

    if (rutasActivas > 0) {
      throw new ConflictException('No puedes eliminar un vehículo con rutas activas');
    }

    await this.prisma.vehiculo.delete({
      where: { id_vehiculo: id },
    });

    return {
      message: 'Vehículo eliminado exitosamente',
    };
  }
}
