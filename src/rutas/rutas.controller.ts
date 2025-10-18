import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { RutasService } from './rutas.service';
import { CreateRutaDto } from './dto/create-ruta.dto';
import { UpdateRutaDto } from './dto/update-ruta.dto';
import { SearchRutaDto } from './dto/search-ruta.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('rutas')
export class RutasController {
  constructor(private readonly rutasService: RutasService) {}

  /**
   * Publicar una nueva ruta
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createRutaDto: CreateRutaDto, @GetUser('id_usuario') conductorId: number) {
    return this.rutasService.create(createRutaDto, conductorId);
  }

  /**
   * Buscar rutas con filtros GPS
   */
  @Get('search')
  search(
    @Query('origen_lat') origenLat?: string,
    @Query('origen_lng') origenLng?: string,
    @Query('destino_lat') destinoLat?: string,
    @Query('destino_lng') destinoLng?: string,
    @Query('fecha_salida') fechaSalida?: string,
    @Query('radio_busqueda') radioBusqueda?: string,
    @Query('asientos_requeridos') asientosRequeridos?: string,
    @Query('precio_maximo') precioMaximo?: string,
    @Query('permite_equipaje') permiteEquipaje?: string,
    @Query('permite_mascotas') permiteMascotas?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const searchDto: SearchRutaDto = {
      origen_lat: origenLat ? parseFloat(origenLat) : undefined,
      origen_lng: origenLng ? parseFloat(origenLng) : undefined,
      destino_lat: destinoLat ? parseFloat(destinoLat) : undefined,
      destino_lng: destinoLng ? parseFloat(destinoLng) : undefined,
      fecha_salida: fechaSalida,
      radio_busqueda: radioBusqueda ? parseFloat(radioBusqueda) : undefined,
      asientos_requeridos: asientosRequeridos ? parseInt(asientosRequeridos, 10) : undefined,
      precio_maximo: precioMaximo ? parseFloat(precioMaximo) : undefined,
      permite_equipaje: permiteEquipaje,
      permite_mascotas: permiteMascotas,
    };

    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;

    return this.rutasService.search(searchDto, pageNumber, limitNumber);
  }

  /**
   * Listar todas las rutas (con filtro opcional por conductor)
   */
  @Get()
  findAll(
    @Query('conductorId') conductorId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.rutasService.findAll(
      conductorId ? parseInt(conductorId, 10) : undefined,
      pageNumber,
      limitNumber,
    );
  }

  /**
   * Obtener una ruta por ID
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rutasService.findOne(id);
  }

  /**
   * Actualizar una ruta
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRutaDto: UpdateRutaDto,
    @GetUser('id_usuario') conductorId: number,
  ) {
    return this.rutasService.update(id, updateRutaDto, conductorId);
  }

  /**
   * Cancelar una ruta
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @GetUser('id_usuario') conductorId: number) {
    return this.rutasService.remove(id, conductorId);
  }
}

