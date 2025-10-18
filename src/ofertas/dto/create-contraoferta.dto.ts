import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateContraofertaDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  precio_contraofertado: number;

  @IsOptional()
  @IsString()
  notas_conductor?: string;
}
