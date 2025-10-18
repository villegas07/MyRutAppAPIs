import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Servir archivos estáticos
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  
  // Habilitar CORS
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',')
    : ['http://localhost:4200'];
  
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Prefijo global para las rutas
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  const appUrl = process.env.APP_URL || `http://localhost:${port}`;
  console.log(`🚀 Aplicación corriendo en: ${appUrl}/api`);
  console.log(`📂 Archivos estáticos: ${appUrl}/uploads`);
  console.log(`📚 Entorno: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
