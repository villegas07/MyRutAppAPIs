import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CancelarViajeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  motivo_cancelacion: string;
}
