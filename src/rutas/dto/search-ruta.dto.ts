import { IsOptional, IsNumber, IsDateString, IsString } from 'class-validator';

export class SearchRutaDto {
  @IsOptional()
  @IsNumber()
  origen_lat?: number;

  @IsOptional()
  @IsNumber()
  origen_lng?: number;

  @IsOptional()
  @IsNumber()
  destino_lat?: number;

  @IsOptional()
  @IsNumber()
  destino_lng?: number;

  @IsOptional()
  @IsDateString()
  fecha_salida?: string;

  @IsOptional()
  @IsNumber()
  radio_busqueda?: number; // en kilómetros, default 5km

  @IsOptional()
  @IsNumber()
  asientos_requeridos?: number;

  @IsOptional()
  @IsNumber()
  precio_maximo?: number;

  @IsOptional()
  @IsString()
  permite_equipaje?: string; // 'true' o 'false'

  @IsOptional()
  @IsString()
  permite_mascotas?: string; // 'true' o 'false'
}
