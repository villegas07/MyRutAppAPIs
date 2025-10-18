import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class UpdateFotoPerfilDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'La URL de la foto de perfil debe ser válida' })
  foto_perfil: string;
}
