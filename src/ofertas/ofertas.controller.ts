import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { OfertasService } from './ofertas.service';
import { CreateOfertaDto } from './dto/create-oferta.dto';
import { CreateContraofertaDto } from './dto/create-contraoferta.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('ofertas')
export class OfertasController {
  constructor(private readonly ofertasService: OfertasService) {}

  /**
   * Crear una nueva oferta
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createOfertaDto: CreateOfertaDto,
    @GetUser('id_usuario') userId: number,
  ) {
    return this.ofertasService.create(createOfertaDto, userId);
  }

  /**
   * Listar ofertas del usuario
   * ?tipo=pasajero | conductor
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @GetUser('id_usuario') userId: number,
    @Query('tipo') tipo: 'pasajero' | 'conductor',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    
    return this.ofertasService.findAll(userId, tipo, pageNumber, limitNumber);
  }

  /**
   * Obtener detalle de una oferta
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ofertasService.findOne(id);
  }

  /**
   * Aceptar una oferta (conductor)
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/accept')
  acceptOferta(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id_usuario') conductorId: number,
  ) {
    return this.ofertasService.acceptOferta(id, conductorId);
  }

  /**
   * Rechazar una oferta (conductor)
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/reject')
  rejectOferta(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id_usuario') conductorId: number,
  ) {
    return this.ofertasService.rejectOferta(id, conductorId);
  }

  /**
   * Crear una contraoferta (conductor)
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/contraoferta')
  createContraoferta(
    @Param('id', ParseIntPipe) ofertaId: number,
    @Body() createContraofertaDto: CreateContraofertaDto,
    @GetUser('id_usuario') conductorId: number,
  ) {
    return this.ofertasService.createContraoferta(ofertaId, createContraofertaDto, conductorId);
  }

  /**
   * Aceptar una contraoferta (pasajero)
   */
  @UseGuards(JwtAuthGuard)
  @Patch('contraofertas/:id/accept')
  acceptContraoferta(
    @Param('id', ParseIntPipe) contraofertaId: number,
    @GetUser('id_usuario') pasajeroId: number,
  ) {
    return this.ofertasService.acceptContraoferta(contraofertaId, pasajeroId);
  }

  /**
   * Rechazar una contraoferta (pasajero)
   */
  @UseGuards(JwtAuthGuard)
  @Patch('contraofertas/:id/reject')
  rejectContraoferta(
    @Param('id', ParseIntPipe) contraofertaId: number,
    @GetUser('id_usuario') pasajeroId: number,
  ) {
    return this.ofertasService.rejectContraoferta(contraofertaId, pasajeroId);
  }
}
