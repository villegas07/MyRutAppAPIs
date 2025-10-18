import { IsString, IsNotEmpty } from 'class-validator';

export class IniciarViajeDto {
  @IsString()
  @IsNotEmpty()
  codigo_verificacion: string;
}
