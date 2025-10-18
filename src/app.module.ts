import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { UploadModule } from './upload/upload.module';
import { RutasModule } from './rutas/rutas.module';
import { OfertasModule } from './ofertas/ofertas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    EmailModule,
    UsuariosModule,
    VehiculosModule,
    UploadModule,
    RutasModule,
    OfertasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
