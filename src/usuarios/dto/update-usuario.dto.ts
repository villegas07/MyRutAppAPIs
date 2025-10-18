import { IsEmail, IsOptional, IsString, MinLength, Matches, IsDateString, MaxLength } from 'class-validator';

export class UpdateUsuarioDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  apellido?: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'El nombre de usuario solo puede contener letras, números y guiones bajos',
  })
  nombre_usuario?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{10,15}$/, {
    message: 'El teléfono debe contener entre 10 y 15 dígitos',
  })
  telefono?: string;

  @IsString()
  @IsOptional()
  foto_perfil?: string;

  @IsDateString()
  @IsOptional()
  fecha_nacimiento?: string;
}
