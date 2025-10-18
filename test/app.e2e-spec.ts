import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Aplicar configuración global como en main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    app.setGlobalPrefix('api');
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) - should redirect or return app info', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect((res) => {
        // Puede ser 404 o 200 dependiendo de si hay un endpoint raíz
        expect([200, 404]).toContain(res.status);
      });
  });

  it('/api/health (GET) - should return health status', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('uptime');
        expect(res.body).toHaveProperty('environment');
        expect(res.body).toHaveProperty('version');
      });
  });
});
