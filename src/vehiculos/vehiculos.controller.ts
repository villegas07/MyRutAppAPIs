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
import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createVehiculoDto: CreateVehiculoDto, @GetUser('id_usuario') userId: number) {
    return this.vehiculosService.create(createVehiculoDto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query('userId') userId?: string) {
    return this.vehiculosService.findAll(userId ? parseInt(userId, 10) : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehiculosService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVehiculoDto: UpdateVehiculoDto,
    @GetUser('id_usuario') userId: number,
  ) {
    return this.vehiculosService.update(id, updateVehiculoDto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @GetUser('id_usuario') userId: number) {
    return this.vehiculosService.remove(id, userId);
  }
}
