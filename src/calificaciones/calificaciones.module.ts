import { Module } from '@nestjs/common';
import { CalificacionesService } from './calificaciones.service';
import { CalificacionesController } from './calificaciones.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CalificacionesService],
  controllers: [CalificacionesController],
  exports: [CalificacionesService],
})
export class CalificacionesModule {}
