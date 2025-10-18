import {
  IsNotEmpty,
  IsInt,
  IsDecimal,
  IsString,
  IsDateString,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  IsNumber,
} from 'class-validator';

export class CreateRutaDto {
  @IsInt()
  @IsNotEmpty()
  id_vehiculo: number;

  @IsNumber()
  @IsNotEmpty()
  origen_lat: number;

  @IsNumber()
  @IsNotEmpty()
  origen_lng: number;

  @IsString()
  @IsNotEmpty()
  origen_direccion: string;

  @IsNumber()
  @IsNotEmpty()
  destino_lat: number;

  @IsNumber()
  @IsNotEmpty()
  destino_lng: number;

  @IsString()
  @IsNotEmpty()
  destino_direccion: string;

  @IsDateString()
  @IsNotEmpty()
  fecha_salida: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  precio_sugerido: number;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(8)
  asientos_disponibles: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  distancia_km?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  duracion_estimada?: number; // en minutos

  @IsOptional()
  @IsBoolean()
  permite_equipaje?: boolean;

  @IsOptional()
  @IsBoolean()
  permite_mascotas?: boolean;

  @IsOptional()
  @IsString()
  notas_adicionales?: string;
}
