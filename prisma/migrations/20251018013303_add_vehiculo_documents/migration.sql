/*
  Warnings:

  - Added the required column `matricula` to the `vehiculos` table without a default value. This is not possible if the table is not empty.
  - Made the column `tipo_vehiculo` on table `vehiculos` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "vehiculos" ADD COLUMN     "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "foto_matricula" VARCHAR(255),
ADD COLUMN     "foto_soat" VARCHAR(255),
ADD COLUMN     "foto_tarjeta_propiedad" VARCHAR(255),
ADD COLUMN     "matricula" VARCHAR(50) NOT NULL,
ALTER COLUMN "tipo_vehiculo" SET NOT NULL;

-- CreateIndex
CREATE INDEX "vehiculos_id_usuario_idx" ON "vehiculos"("id_usuario");

-- CreateIndex
CREATE INDEX "vehiculos_placa_idx" ON "vehiculos"("placa");
