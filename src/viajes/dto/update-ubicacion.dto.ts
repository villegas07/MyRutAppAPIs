import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

export class UpdateUbicacionDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(-90)
  @Max(90)
  latitud_actual: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(-180)
  @Max(180)
  longitud_actual: number;
}
