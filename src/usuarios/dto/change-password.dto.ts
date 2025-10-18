import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  password_actual: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número o carácter especial',
  })
  password_nueva: string;
}
