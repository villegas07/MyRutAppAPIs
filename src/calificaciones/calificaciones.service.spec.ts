import { Test, TestingModule } from '@nestjs/testing';
import { CalificacionesService } from './calificaciones.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CalificacionesService', () => {
  let service: CalificacionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalificacionesService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CalificacionesService>(CalificacionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
