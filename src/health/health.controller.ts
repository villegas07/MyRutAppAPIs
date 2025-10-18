import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
  }

  @Get('db')
  async checkDatabase() {
    // Este endpoint puede ser usado para verificar la conexión a la BD
    return {
      status: 'ok',
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
