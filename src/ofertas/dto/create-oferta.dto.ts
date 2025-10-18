import {
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CreateOfertaDto {
  @IsInt()
  @IsNotEmpty()
  id_ruta: number;

  @IsNumber()
  @IsNotEmpty()
  punto_recogida_lat: number;

  @IsNumber()
  @IsNotEmpty()
  punto_recogida_lng: number;

  @IsString()
  @IsNotEmpty()
  punto_recogida_direccion: string;

  @IsNumber()
  @IsNotEmpty()
  punto_destino_lat: number;

  @IsNumber()
  @IsNotEmpty()
  punto_destino_lng: number;

  @IsString()
  @IsNotEmpty()
  punto_destino_direccion: string;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(8)
  cantidad_pasajeros: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  precio_ofertado: number;

  @IsOptional()
  @IsString()
  notas_pasajero?: string;
}
