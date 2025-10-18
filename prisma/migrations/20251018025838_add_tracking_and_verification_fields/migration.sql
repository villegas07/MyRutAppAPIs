-- AlterTable
ALTER TABLE "viajes" ADD COLUMN     "codigo_verificacion_fin" VARCHAR(10),
ADD COLUMN     "codigo_verificacion_inicio" VARCHAR(10),
ADD COLUMN     "fecha_fin_real" TIMESTAMP(3),
ADD COLUMN     "fecha_inicio_real" TIMESTAMP(3),
ADD COLUMN     "latitud_actual" DECIMAL(10,8),
ADD COLUMN     "longitud_actual" DECIMAL(11,8),
ADD COLUMN     "motivo_cancelacion" TEXT;

-- CreateIndex
CREATE INDEX "calificaciones_id_evaluado_idx" ON "calificaciones"("id_evaluado");

-- CreateIndex
CREATE INDEX "calificaciones_id_viaje_idx" ON "calificaciones"("id_viaje");
