-- CreateTable
CREATE TABLE "usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "telefono" VARCHAR(20) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "foto_perfil" VARCHAR(255),
    "rol" VARCHAR(20) NOT NULL DEFAULT 'usuario',
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_nacimiento" DATE,
    "calificacion_conductor" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "calificacion_pasajero" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "total_viajes_conductor" INTEGER NOT NULL DEFAULT 0,
    "total_viajes_pasajero" INTEGER NOT NULL DEFAULT 0,
    "estado_cuenta" VARCHAR(20) NOT NULL DEFAULT 'activo',
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "ultimo_acceso" TIMESTAMP(3),
    "refresh_token" TEXT,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "tokens_verificacion" (
    "id_token" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expira" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tokens_verificacion_pkey" PRIMARY KEY ("id_token")
);

-- CreateTable
CREATE TABLE "vehiculos" (
    "id_vehiculo" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "marca" VARCHAR(50) NOT NULL,
    "modelo" VARCHAR(50) NOT NULL,
    "anio" INTEGER NOT NULL,
    "color" VARCHAR(30) NOT NULL,
    "placa" VARCHAR(20) NOT NULL,
    "capacidad_pasajeros" INTEGER NOT NULL,
    "tipo_vehiculo" VARCHAR(30),
    "foto_vehiculo" VARCHAR(255),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'activo',
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehiculos_pkey" PRIMARY KEY ("id_vehiculo")
);

-- CreateTable
CREATE TABLE "rutas" (
    "id_ruta" SERIAL NOT NULL,
    "id_conductor" INTEGER NOT NULL,
    "id_vehiculo" INTEGER NOT NULL,
    "origen_lat" DECIMAL(10,8) NOT NULL,
    "origen_lng" DECIMAL(11,8) NOT NULL,
    "origen_direccion" TEXT NOT NULL,
    "destino_lat" DECIMAL(10,8) NOT NULL,
    "destino_lng" DECIMAL(11,8) NOT NULL,
    "destino_direccion" TEXT NOT NULL,
    "fecha_salida" TIMESTAMP(3) NOT NULL,
    "precio_sugerido" DECIMAL(10,2) NOT NULL,
    "asientos_disponibles" INTEGER NOT NULL,
    "asientos_ocupados" INTEGER NOT NULL DEFAULT 0,
    "distancia_km" DECIMAL(10,2),
    "duracion_estimada" INTEGER,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'publicada',
    "permite_equipaje" BOOLEAN NOT NULL DEFAULT true,
    "permite_mascotas" BOOLEAN NOT NULL DEFAULT false,
    "notas_adicionales" TEXT,
    "fecha_publicacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rutas_pkey" PRIMARY KEY ("id_ruta")
);

-- CreateTable
CREATE TABLE "ofertas" (
    "id_oferta" SERIAL NOT NULL,
    "id_ruta" INTEGER NOT NULL,
    "id_pasajero" INTEGER NOT NULL,
    "punto_recogida_lat" DECIMAL(10,8) NOT NULL,
    "punto_recogida_lng" DECIMAL(11,8) NOT NULL,
    "punto_recogida_direccion" TEXT NOT NULL,
    "punto_destino_lat" DECIMAL(10,8) NOT NULL,
    "punto_destino_lng" DECIMAL(11,8) NOT NULL,
    "punto_destino_direccion" TEXT NOT NULL,
    "cantidad_pasajeros" INTEGER NOT NULL DEFAULT 1,
    "precio_ofertado" DECIMAL(10,2) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "notas_pasajero" TEXT,
    "fecha_oferta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" TIMESTAMP(3),

    CONSTRAINT "ofertas_pkey" PRIMARY KEY ("id_oferta")
);

-- CreateTable
CREATE TABLE "contraofertas" (
    "id_contraoferta" SERIAL NOT NULL,
    "id_oferta" INTEGER NOT NULL,
    "id_conductor" INTEGER NOT NULL,
    "precio_contraofertado" DECIMAL(10,2) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "notas_conductor" TEXT,
    "fecha_contraoferta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" TIMESTAMP(3),

    CONSTRAINT "contraofertas_pkey" PRIMARY KEY ("id_contraoferta")
);

-- CreateTable
CREATE TABLE "viajes" (
    "id_viaje" SERIAL NOT NULL,
    "id_ruta" INTEGER NOT NULL,
    "id_oferta" INTEGER NOT NULL,
    "id_conductor" INTEGER NOT NULL,
    "id_pasajero" INTEGER NOT NULL,
    "id_vehiculo" INTEGER NOT NULL,
    "precio_final" DECIMAL(10,2) NOT NULL,
    "cantidad_pasajeros" INTEGER NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'confirmado',
    "punto_recogida_lat" DECIMAL(10,8) NOT NULL,
    "punto_recogida_lng" DECIMAL(11,8) NOT NULL,
    "punto_recogida_direccion" TEXT NOT NULL,
    "punto_destino_lat" DECIMAL(10,8) NOT NULL,
    "punto_destino_lng" DECIMAL(11,8) NOT NULL,
    "punto_destino_direccion" TEXT NOT NULL,
    "fecha_recogida_estimada" TIMESTAMP(3) NOT NULL,
    "fecha_recogida_real" TIMESTAMP(3),
    "fecha_llegada_estimada" TIMESTAMP(3),
    "fecha_llegada_real" TIMESTAMP(3),
    "distancia_recorrida" DECIMAL(10,2),
    "fecha_confirmacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "codigo_verificacion" VARCHAR(10),

    CONSTRAINT "viajes_pkey" PRIMARY KEY ("id_viaje")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id_pago" SERIAL NOT NULL,
    "id_viaje" INTEGER NOT NULL,
    "id_pasajero" INTEGER NOT NULL,
    "id_conductor" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "comision_plataforma" DECIMAL(10,2) NOT NULL,
    "monto_conductor" DECIMAL(10,2) NOT NULL,
    "metodo_pago" VARCHAR(30) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "referencia_transaccion" VARCHAR(100),
    "fecha_pago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_procesado" TIMESTAMP(3),

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id_pago")
);

-- CreateTable
CREATE TABLE "calificaciones" (
    "id_calificacion" SERIAL NOT NULL,
    "id_viaje" INTEGER NOT NULL,
    "id_evaluador" INTEGER NOT NULL,
    "id_evaluado" INTEGER NOT NULL,
    "tipo_evaluacion" VARCHAR(20) NOT NULL,
    "puntuacion" INTEGER NOT NULL,
    "comentario" TEXT,
    "fecha_calificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calificaciones_pkey" PRIMARY KEY ("id_calificacion")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id_notificacion" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "titulo" VARCHAR(100) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "id_referencia" INTEGER,
    "tipo_referencia" VARCHAR(30),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id_notificacion")
);

-- CreateTable
CREATE TABLE "mensajes" (
    "id_mensaje" SERIAL NOT NULL,
    "id_viaje" INTEGER NOT NULL,
    "id_remitente" INTEGER NOT NULL,
    "id_destinatario" INTEGER NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "fecha_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_pkey" PRIMARY KEY ("id_mensaje")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id_documento" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "tipo_documento" VARCHAR(50) NOT NULL,
    "numero_documento" VARCHAR(100),
    "foto_documento" VARCHAR(255),
    "fecha_emision" DATE,
    "fecha_vencimiento" DATE,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "fecha_subida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id_documento")
);

-- CreateTable
CREATE TABLE "ubicaciones" (
    "id_ubicacion" SERIAL NOT NULL,
    "id_viaje" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "latitud" DECIMAL(10,8) NOT NULL,
    "longitud" DECIMAL(11,8) NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ubicaciones_pkey" PRIMARY KEY ("id_ubicacion")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id_permiso" SERIAL NOT NULL,
    "nombre_permiso" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "modulo" VARCHAR(50) NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id_permiso")
);

-- CreateTable
CREATE TABLE "roles_permisos" (
    "id_rol_permiso" SERIAL NOT NULL,
    "rol" VARCHAR(20) NOT NULL,
    "id_permiso" INTEGER NOT NULL,
    "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_permisos_pkey" PRIMARY KEY ("id_rol_permiso")
);

-- CreateTable
CREATE TABLE "reportes" (
    "id_reporte" SERIAL NOT NULL,
    "id_reportante" INTEGER NOT NULL,
    "id_reportado" INTEGER NOT NULL,
    "id_viaje" INTEGER,
    "tipo_reporte" VARCHAR(50) NOT NULL,
    "categoria" VARCHAR(50),
    "descripcion" TEXT NOT NULL,
    "evidencia" VARCHAR(255),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "prioridad" VARCHAR(20) NOT NULL DEFAULT 'media',
    "id_admin_asignado" INTEGER,
    "resolucion" TEXT,
    "fecha_reporte" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_revision" TIMESTAMP(3),
    "fecha_resolucion" TIMESTAMP(3),

    CONSTRAINT "reportes_pkey" PRIMARY KEY ("id_reporte")
);

-- CreateTable
CREATE TABLE "sanciones" (
    "id_sancion" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_reporte" INTEGER,
    "id_admin" INTEGER NOT NULL,
    "tipo_sancion" VARCHAR(30) NOT NULL,
    "duracion_dias" INTEGER,
    "monto_multa" DECIMAL(10,2),
    "razon" TEXT NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'activa',
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3),
    "notas_admin" TEXT,

    CONSTRAINT "sanciones_pkey" PRIMARY KEY ("id_sancion")
);

-- CreateTable
CREATE TABLE "verificaciones" (
    "id_verificacion" SERIAL NOT NULL,
    "id_documento" INTEGER NOT NULL,
    "id_admin" INTEGER NOT NULL,
    "estado_verificacion" VARCHAR(20) NOT NULL,
    "motivo_rechazo" TEXT,
    "fecha_verificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verificaciones_pkey" PRIMARY KEY ("id_verificacion")
);

-- CreateTable
CREATE TABLE "configuracion_comisiones" (
    "id_comision" SERIAL NOT NULL,
    "tipo_servicio" VARCHAR(50) NOT NULL,
    "porcentaje_comision" DECIMAL(5,2) NOT NULL,
    "monto_minimo" DECIMAL(10,2),
    "monto_maximo" DECIMAL(10,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3),
    "id_admin" INTEGER,

    CONSTRAINT "configuracion_comisiones_pkey" PRIMARY KEY ("id_comision")
);

-- CreateTable
CREATE TABLE "retiros" (
    "id_retiro" SERIAL NOT NULL,
    "id_conductor" INTEGER NOT NULL,
    "monto_solicitado" DECIMAL(10,2) NOT NULL,
    "monto_aprobado" DECIMAL(10,2),
    "metodo_retiro" VARCHAR(30) NOT NULL,
    "datos_bancarios" TEXT,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "id_admin_revisor" INTEGER,
    "motivo_rechazo" TEXT,
    "referencia_transaccion" VARCHAR(100),
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_revision" TIMESTAMP(3),
    "fecha_procesado" TIMESTAMP(3),

    CONSTRAINT "retiros_pkey" PRIMARY KEY ("id_retiro")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id_log" SERIAL NOT NULL,
    "id_usuario" INTEGER,
    "tipo_usuario" VARCHAR(20),
    "accion" VARCHAR(100) NOT NULL,
    "modulo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "ip_address" VARCHAR(45),
    "datos_anteriores" TEXT,
    "datos_nuevos" TEXT,
    "fecha_accion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id_log")
);

-- CreateTable
CREATE TABLE "cupones" (
    "id_cupon" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "tipo_descuento" VARCHAR(20) NOT NULL,
    "valor_descuento" DECIMAL(10,2) NOT NULL,
    "monto_minimo" DECIMAL(10,2),
    "limite_uso" INTEGER,
    "usos_actuales" INTEGER NOT NULL DEFAULT 0,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_expiracion" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "id_admin_creador" INTEGER,
    "descripcion" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cupones_pkey" PRIMARY KEY ("id_cupon")
);

-- CreateTable
CREATE TABLE "cupones_usados" (
    "id_cupon_usado" SERIAL NOT NULL,
    "id_cupon" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_viaje" INTEGER NOT NULL,
    "monto_descuento" DECIMAL(10,2) NOT NULL,
    "fecha_uso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cupones_usados_pkey" PRIMARY KEY ("id_cupon_usado")
);

-- CreateTable
CREATE TABLE "configuracion_app" (
    "id_config" SERIAL NOT NULL,
    "clave" VARCHAR(100) NOT NULL,
    "valor" TEXT NOT NULL,
    "tipo_dato" VARCHAR(20) NOT NULL,
    "descripcion" TEXT,
    "categoria" VARCHAR(50),
    "id_admin_modificador" INTEGER,
    "fecha_modificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuracion_app_pkey" PRIMARY KEY ("id_config")
);

-- CreateTable
CREATE TABLE "estadisticas_diarias" (
    "id_estadistica" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "total_usuarios_nuevos" INTEGER NOT NULL DEFAULT 0,
    "total_rutas_publicadas" INTEGER NOT NULL DEFAULT 0,
    "total_viajes_completados" INTEGER NOT NULL DEFAULT 0,
    "total_ofertas_realizadas" INTEGER NOT NULL DEFAULT 0,
    "ingresos_totales" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "comisiones_totales" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "usuarios_activos" INTEGER NOT NULL DEFAULT 0,
    "conductores_activos" INTEGER NOT NULL DEFAULT 0,
    "fecha_calculo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estadisticas_diarias_pkey" PRIMARY KEY ("id_estadistica")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_verificacion_token_key" ON "tokens_verificacion"("token");

-- CreateIndex
CREATE INDEX "tokens_verificacion_token_idx" ON "tokens_verificacion"("token");

-- CreateIndex
CREATE INDEX "tokens_verificacion_id_usuario_idx" ON "tokens_verificacion"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "vehiculos_placa_key" ON "vehiculos"("placa");

-- CreateIndex
CREATE INDEX "rutas_id_conductor_idx" ON "rutas"("id_conductor");

-- CreateIndex
CREATE INDEX "rutas_estado_idx" ON "rutas"("estado");

-- CreateIndex
CREATE INDEX "rutas_fecha_salida_idx" ON "rutas"("fecha_salida");

-- CreateIndex
CREATE INDEX "ofertas_id_ruta_idx" ON "ofertas"("id_ruta");

-- CreateIndex
CREATE INDEX "ofertas_id_pasajero_idx" ON "ofertas"("id_pasajero");

-- CreateIndex
CREATE INDEX "ofertas_estado_idx" ON "ofertas"("estado");

-- CreateIndex
CREATE INDEX "viajes_id_conductor_idx" ON "viajes"("id_conductor");

-- CreateIndex
CREATE INDEX "viajes_id_pasajero_idx" ON "viajes"("id_pasajero");

-- CreateIndex
CREATE INDEX "viajes_estado_idx" ON "viajes"("estado");

-- CreateIndex
CREATE INDEX "notificaciones_id_usuario_idx" ON "notificaciones"("id_usuario");

-- CreateIndex
CREATE INDEX "mensajes_id_viaje_idx" ON "mensajes"("id_viaje");

-- CreateIndex
CREATE INDEX "ubicaciones_id_viaje_idx" ON "ubicaciones"("id_viaje");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_nombre_permiso_key" ON "permisos"("nombre_permiso");

-- CreateIndex
CREATE INDEX "reportes_estado_idx" ON "reportes"("estado");

-- CreateIndex
CREATE INDEX "reportes_id_admin_asignado_idx" ON "reportes"("id_admin_asignado");

-- CreateIndex
CREATE INDEX "sanciones_id_usuario_idx" ON "sanciones"("id_usuario");

-- CreateIndex
CREATE INDEX "retiros_id_conductor_idx" ON "retiros"("id_conductor");

-- CreateIndex
CREATE INDEX "retiros_estado_idx" ON "retiros"("estado");

-- CreateIndex
CREATE INDEX "logs_auditoria_id_usuario_idx" ON "logs_auditoria"("id_usuario");

-- CreateIndex
CREATE INDEX "logs_auditoria_fecha_accion_idx" ON "logs_auditoria"("fecha_accion");

-- CreateIndex
CREATE UNIQUE INDEX "cupones_codigo_key" ON "cupones"("codigo");

-- CreateIndex
CREATE INDEX "cupones_codigo_idx" ON "cupones"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_app_clave_key" ON "configuracion_app"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "estadisticas_diarias_fecha_key" ON "estadisticas_diarias"("fecha");

-- AddForeignKey
ALTER TABLE "tokens_verificacion" ADD CONSTRAINT "tokens_verificacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutas" ADD CONSTRAINT "rutas_id_conductor_fkey" FOREIGN KEY ("id_conductor") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutas" ADD CONSTRAINT "rutas_id_vehiculo_fkey" FOREIGN KEY ("id_vehiculo") REFERENCES "vehiculos"("id_vehiculo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_id_ruta_fkey" FOREIGN KEY ("id_ruta") REFERENCES "rutas"("id_ruta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_id_pasajero_fkey" FOREIGN KEY ("id_pasajero") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contraofertas" ADD CONSTRAINT "contraofertas_id_oferta_fkey" FOREIGN KEY ("id_oferta") REFERENCES "ofertas"("id_oferta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contraofertas" ADD CONSTRAINT "contraofertas_id_conductor_fkey" FOREIGN KEY ("id_conductor") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viajes" ADD CONSTRAINT "viajes_id_ruta_fkey" FOREIGN KEY ("id_ruta") REFERENCES "rutas"("id_ruta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viajes" ADD CONSTRAINT "viajes_id_oferta_fkey" FOREIGN KEY ("id_oferta") REFERENCES "ofertas"("id_oferta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viajes" ADD CONSTRAINT "viajes_id_conductor_fkey" FOREIGN KEY ("id_conductor") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viajes" ADD CONSTRAINT "viajes_id_pasajero_fkey" FOREIGN KEY ("id_pasajero") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viajes" ADD CONSTRAINT "viajes_id_vehiculo_fkey" FOREIGN KEY ("id_vehiculo") REFERENCES "vehiculos"("id_vehiculo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_id_viaje_fkey" FOREIGN KEY ("id_viaje") REFERENCES "viajes"("id_viaje") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_id_pasajero_fkey" FOREIGN KEY ("id_pasajero") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_id_conductor_fkey" FOREIGN KEY ("id_conductor") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_id_viaje_fkey" FOREIGN KEY ("id_viaje") REFERENCES "viajes"("id_viaje") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_id_evaluador_fkey" FOREIGN KEY ("id_evaluador") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_id_evaluado_fkey" FOREIGN KEY ("id_evaluado") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_id_viaje_fkey" FOREIGN KEY ("id_viaje") REFERENCES "viajes"("id_viaje") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_id_remitente_fkey" FOREIGN KEY ("id_remitente") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_id_destinatario_fkey" FOREIGN KEY ("id_destinatario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ubicaciones" ADD CONSTRAINT "ubicaciones_id_viaje_fkey" FOREIGN KEY ("id_viaje") REFERENCES "viajes"("id_viaje") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ubicaciones" ADD CONSTRAINT "ubicaciones_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_id_permiso_fkey" FOREIGN KEY ("id_permiso") REFERENCES "permisos"("id_permiso") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_id_reportante_fkey" FOREIGN KEY ("id_reportante") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_id_reportado_fkey" FOREIGN KEY ("id_reportado") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_id_viaje_fkey" FOREIGN KEY ("id_viaje") REFERENCES "viajes"("id_viaje") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_id_admin_asignado_fkey" FOREIGN KEY ("id_admin_asignado") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanciones" ADD CONSTRAINT "sanciones_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanciones" ADD CONSTRAINT "sanciones_id_reporte_fkey" FOREIGN KEY ("id_reporte") REFERENCES "reportes"("id_reporte") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanciones" ADD CONSTRAINT "sanciones_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verificaciones" ADD CONSTRAINT "verificaciones_id_documento_fkey" FOREIGN KEY ("id_documento") REFERENCES "documentos"("id_documento") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verificaciones" ADD CONSTRAINT "verificaciones_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retiros" ADD CONSTRAINT "retiros_id_conductor_fkey" FOREIGN KEY ("id_conductor") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retiros" ADD CONSTRAINT "retiros_id_admin_revisor_fkey" FOREIGN KEY ("id_admin_revisor") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cupones_usados" ADD CONSTRAINT "cupones_usados_id_cupon_fkey" FOREIGN KEY ("id_cupon") REFERENCES "cupones"("id_cupon") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cupones_usados" ADD CONSTRAINT "cupones_usados_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cupones_usados" ADD CONSTRAINT "cupones_usados_id_viaje_fkey" FOREIGN KEY ("id_viaje") REFERENCES "viajes"("id_viaje") ON DELETE CASCADE ON UPDATE CASCADE;
