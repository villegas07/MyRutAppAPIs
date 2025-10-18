import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

// Configuración de almacenamiento
export const multerConfig = {
  // Límite de tamaño: 5MB
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  // Filtro de archivos
  fileFilter: (req: any, file: any, cb: any) => {
    // Solo permitir imágenes
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          'Solo se permiten archivos de imagen (jpg, jpeg, png, gif, webp)',
        ),
        false,
      );
    }
  },
};

// Configuración de almacenamiento en disco
export const multerOptions = {
  ...multerConfig,
  storage: diskStorage({
    destination: (req: any, file: any, cb: any) => {
      const uploadPath = './uploads';
      // Crear directorio si no existe
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req: any, file: any, cb: any) => {
      // Generar nombre único
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
};

// Configuración específica para cada tipo de foto
export const photoStorageConfig = (folder: string) => ({
  ...multerConfig,
  storage: diskStorage({
    destination: (req: any, file: any, cb: any) => {
      const uploadPath = `./uploads/${folder}`;
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req: any, file: any, cb: any) => {
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
});
