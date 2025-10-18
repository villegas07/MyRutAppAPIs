import { IsString, IsNotEmpty } from 'class-validator';

export class FinalizarViajeDto {
  @IsString()
  @IsNotEmpty()
  codigo_verificacion: string;
}
