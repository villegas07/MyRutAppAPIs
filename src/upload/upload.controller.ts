import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { photoStorageConfig } from './multer.config';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload de foto de perfil de usuario
   */
  @Post('perfil')
  @UseInterceptors(FileInterceptor('file', photoStorageConfig('perfiles')))
  uploadPerfilPhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    this.uploadService.validateImage(file);

    return {
      message: 'Foto de perfil subida exitosamente',
      filename: file.filename,
      url: this.uploadService.getFileUrl(file.filename, 'perfiles'),
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  /**
   * Upload de foto de vehículo
   */
  @Post('vehiculo')
  @UseInterceptors(FileInterceptor('file', photoStorageConfig('vehiculos')))
  uploadVehiculoPhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    this.uploadService.validateImage(file);

    return {
      message: 'Foto de vehículo subida exitosamente',
      filename: file.filename,
      url: this.uploadService.getFileUrl(file.filename, 'vehiculos'),
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  /**
   * Upload de tarjeta de propiedad
   */
  @Post('tarjeta-propiedad')
  @UseInterceptors(FileInterceptor('file', photoStorageConfig('documentos')))
  uploadTarjetaPropiedad(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    this.uploadService.validateImage(file);

    return {
      message: 'Tarjeta de propiedad subida exitosamente',
      filename: file.filename,
      url: this.uploadService.getFileUrl(file.filename, 'documentos'),
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  /**
   * Upload de SOAT
   */
  @Post('soat')
  @UseInterceptors(FileInterceptor('file', photoStorageConfig('documentos')))
  uploadSoat(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    this.uploadService.validateImage(file);

    return {
      message: 'SOAT subido exitosamente',
      filename: file.filename,
      url: this.uploadService.getFileUrl(file.filename, 'documentos'),
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  /**
   * Upload de foto de matrícula
   */
  @Post('matricula')
  @UseInterceptors(FileInterceptor('file', photoStorageConfig('documentos')))
  uploadMatricula(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    this.uploadService.validateImage(file);

    return {
      message: 'Foto de matrícula subida exitosamente',
      filename: file.filename,
      url: this.uploadService.getFileUrl(file.filename, 'documentos'),
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  /**
   * Upload genérico de imagen
   */
  @Post('image')
  @UseInterceptors(FileInterceptor('file', photoStorageConfig('general')))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    this.uploadService.validateImage(file);

    return {
      message: 'Imagen subida exitosamente',
      filename: file.filename,
      url: this.uploadService.getFileUrl(file.filename, 'general'),
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
