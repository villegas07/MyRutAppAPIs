import { IsString, IsNotEmpty, IsInt, IsOptional, Min, Max, Matches, IsIn, IsUrl, MinLength, MaxLength } from 'class-validator';

export class CreateVehiculoDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}[0-9]{3}$/, {
    message: 'La placa debe tener el formato ABC123',
  })
  placa: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'La matrícula debe tener al menos 5 caracteres' })
  @MaxLength(50, { message: 'La matrícula no puede exceder 50 caracteres' })
  matricula: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  marca: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  modelo: string;

  @IsInt()
  @Min(1990)
  @Max(new Date().getFullYear() + 1)
  anio: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(30)
  color: string;

  @IsInt()
  @Min(1)
  @Max(8)
  capacidad_pasajeros: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Moto', 'Carro'], {
    message: 'El tipo de vehículo debe ser "Moto" o "Carro"',
  })
  tipo_vehiculo: string;

  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'La URL de la foto del vehículo debe ser válida' })
  foto_vehiculo?: string;

  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'La URL de la tarjeta de propiedad debe ser válida' })
  foto_tarjeta_propiedad?: string;

  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'La URL del SOAT debe ser válida' })
  foto_soat?: string;

  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'La URL de la foto de matrícula debe ser válida' })
  foto_matricula?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}
