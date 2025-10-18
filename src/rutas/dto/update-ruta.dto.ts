import { PartialType } from '@nestjs/mapped-types';
import { CreateRutaDto } from './create-ruta.dto';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateRutaDto extends PartialType(CreateRutaDto) {
  @IsOptional()
  @IsString()
  @IsIn(['publicada', 'cancelada', 'completada', 'en_curso'])
  estado?: string;
}
