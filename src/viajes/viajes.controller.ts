import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ViajesService } from './viajes.service';
import { IniciarViajeDto } from './dto/iniciar-viaje.dto';
import { FinalizarViajeDto } from './dto/finalizar-viaje.dto';
import { UpdateUbicacionDto } from './dto/update-ubicacion.dto';
import { CancelarViajeDto } from './dto/cancelar-viaje.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('viajes')
@UseGuards(JwtAuthGuard)
export class ViajesController {
  constructor(private readonly viajesService: ViajesService) {}

  /**
   * Listar viajes del usuario
   * ?rol=conductor|pasajero
   */
  @Get()
  findAll(
    @GetUser('id_usuario') userId: number,
    @Query('rol') rol: 'conductor' | 'pasajero',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    
    return this.viajesService.findAll(userId, rol, pageNumber, limitNumber);
  }

  /**
   * Obtener historial de viajes completados
   * ?rol=conductor|pasajero
   */
  @Get('historial')
  getHistorial(
    @GetUser('id_usuario') userId: number,
    @Query('rol') rol: 'conductor' | 'pasajero',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 20;
    
    return this.viajesService.getHistorial(userId, rol, pageNumber, limitNumber);
  }

  /**
   * Obtener detalle de un viaje
   */
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id_usuario') userId: number,
  ) {
    return this.viajesService.findOne(id, userId);
  }

  /**
   * Iniciar viaje (conductor verifica código del pasajero)
   */
  @Post(':id/iniciar')
  iniciarViaje(
    @Param('id', ParseIntPipe) id: number,
    @Body() iniciarViajeDto: IniciarViajeDto,
    @GetUser('id_usuario') conductorId: number,
  ) {
    return this.viajesService.iniciarViaje(id, iniciarViajeDto, conductorId);
  }

  /**
   * Actualizar ubicación del conductor
   */
  @Patch(':id/ubicacion')
  updateUbicacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUbicacionDto: UpdateUbicacionDto,
    @GetUser('id_usuario') conductorId: number,
  ) {
    return this.viajesService.updateUbicacion(id, updateUbicacionDto, conductorId);
  }

  /**
   * Obtener ubicación actual del conductor (pasajero)
   */
  @Get(':id/ubicacion')
  getUbicacionConductor(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id_usuario') pasajeroId: number,
  ) {
    return this.viajesService.getUbicacionConductor(id, pasajeroId);
  }

  /**
   * Finalizar viaje (pasajero verifica código del conductor)
   */
  @Post(':id/finalizar')
  finalizarViaje(
    @Param('id', ParseIntPipe) id: number,
    @Body() finalizarViajeDto: FinalizarViajeDto,
    @GetUser('id_usuario') pasajeroId: number,
  ) {
    return this.viajesService.finalizarViaje(id, finalizarViajeDto, pasajeroId);
  }

  /**
   * Cancelar viaje
   */
  @Patch(':id/cancelar')
  cancelarViaje(
    @Param('id', ParseIntPipe) id: number,
    @Body() cancelarViajeDto: CancelarViajeDto,
    @GetUser('id_usuario') userId: number,
  ) {
    return this.viajesService.cancelarViaje(id, cancelarViajeDto, userId);
  }
}
