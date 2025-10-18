import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateFotoPerfilDto } from './dto/update-foto-perfil.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.usuariosService.findAll(pageNumber, limitNumber, search);
  }

  @Get('username/:username')
  findByUsername(@Param('username') username: string) {
    return this.usuariosService.findByUsername(username);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  getStats(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.getStats(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @GetUser('id_usuario') userId: number,
  ) {
    // Solo el propio usuario puede actualizar su perfil
    if (id !== userId) {
      throw new Error('No tienes permiso para actualizar este usuario');
    }
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Patch(':id/change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() changePasswordDto: ChangePasswordDto,
    @GetUser('id_usuario') userId: number,
  ) {
    // Solo el propio usuario puede cambiar su contraseña
    if (id !== userId) {
      throw new Error('No tienes permiso para cambiar la contraseña de este usuario');
    }
    return this.usuariosService.changePassword(id, changePasswordDto);
  }

  @Put(':id/foto-perfil')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  updateFotoPerfil(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFotoPerfilDto: UpdateFotoPerfilDto,
    @GetUser('id_usuario') userId: number,
  ) {
    // Solo el propio usuario puede actualizar su foto de perfil
    if (id !== userId) {
      throw new Error('No tienes permiso para actualizar la foto de perfil de este usuario');
    }
    return this.usuariosService.updateFotoPerfil(id, updateFotoPerfilDto.foto_perfil);
  }

  @Delete(':id/foto-perfil')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  deleteFotoPerfil(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id_usuario') userId: number,
  ) {
    // Solo el propio usuario puede eliminar su foto de perfil
    if (id !== userId) {
      throw new Error('No tienes permiso para eliminar la foto de perfil de este usuario');
    }
    return this.usuariosService.deleteFotoPerfil(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @GetUser('id_usuario') userId: number) {
    // Solo el propio usuario puede desactivarse
    if (id !== userId) {
      throw new Error('No tienes permiso para desactivar este usuario');
    }
    return this.usuariosService.remove(id);
  }
}
