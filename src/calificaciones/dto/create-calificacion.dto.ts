import { IsNumber, IsString, IsOptional, Min, Max, MinLength, MaxLength } from 'class-validator';

export class CreateCalificacionDto {
  @IsNumber()
  id_viaje: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  puntuacion: number;

  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(500)
  comentario?: string;
}
