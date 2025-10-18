import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CalificacionesService } from './calificaciones.service';
import { CreateCalificacionDto } from './dto/create-calificacion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('calificaciones')
@UseGuards(JwtAuthGuard)
export class CalificacionesController {
  constructor(private readonly calificacionesService: CalificacionesService) {}

  /**
   * Crear una calificación
   */
  @Post()
  create(
    @Body() createCalificacionDto: CreateCalificacionDto,
    @GetUser('id_usuario') userId: number,
  ) {
    return this.calificacionesService.create(createCalificacionDto, userId);
  }

  /**
   * Obtener calificaciones de un usuario
   * ?tipo=conductor|pasajero
   */
  @Get('usuario/:id')
  findByUsuario(
    @Param('id', ParseIntPipe) usuarioId: number,
    @Query('tipo') tipo: 'conductor' | 'pasajero' = 'conductor',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 20;
    
    return this.calificacionesService.findByUsuario(usuarioId, tipo, pageNumber, limitNumber);
  }

  /**
   * Obtener estadísticas de calificaciones de un usuario
   * ?tipo=conductor|pasajero
   */
  @Get('usuario/:id/estadisticas')
  getEstadisticas(
    @Param('id', ParseIntPipe) usuarioId: number,
    @Query('tipo') tipo: 'conductor' | 'pasajero' = 'conductor',
  ) {
    return this.calificacionesService.getEstadisticas(usuarioId, tipo);
  }

  /**
   * Obtener calificaciones de un viaje
   */
  @Get('viaje/:id')
  findByViaje(@Param('id', ParseIntPipe) viajeId: number) {
    return this.calificacionesService.findByViaje(viajeId);
  }
}
