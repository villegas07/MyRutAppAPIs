import { Injectable, BadRequestException } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
  /**
   * Obtiene la URL pública de un archivo subido
   */
  getFileUrl(filename: string, folder?: string): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    if (folder) {
      return `${baseUrl}/uploads/${folder}/${filename}`;
    }
    return `${baseUrl}/uploads/${filename}`;
  }

  /**
   * Valida que el archivo sea una imagen
   */
  validateImage(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('El archivo debe ser una imagen (jpg, jpeg, png, gif, webp)');
    }

    // Verificar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('El archivo no debe superar los 5MB');
    }
  }

  /**
   * Elimina un archivo del servidor
   */
  async deleteFile(filename: string, folder?: string): Promise<void> {
    try {
      const filePath = folder 
        ? join(process.cwd(), 'uploads', folder, filename)
        : join(process.cwd(), 'uploads', filename);

      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      // No lanzar error, solo loguear
    }
  }

  /**
   * Extrae el nombre del archivo de una URL
   */
  extractFilename(url: string): string | null {
    try {
      const urlParts = url.split('/');
      return urlParts[urlParts.length - 1];
    } catch {
      return null;
    }
  }

  /**
   * Extrae el folder de una URL
   */
  extractFolder(url: string): string | null {
    try {
      const urlParts = url.split('/uploads/');
      if (urlParts.length > 1) {
        const pathParts = urlParts[1].split('/');
        return pathParts.length > 1 ? pathParts[0] : null;
      }
      return null;
    } catch {
      return null;
    }
  }
}
