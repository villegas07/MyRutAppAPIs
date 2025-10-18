-- Script para insertar datos iniciales después de la migración

-- Insertar permisos básicos
INSERT INTO permisos (nombre_permiso, descripcion, modulo) VALUES
('ver_usuarios', 'Ver listado de usuarios', 'usuarios'),
('editar_usuarios', 'Editar información de usuarios', 'usuarios'),
('suspender_usuarios', 'Suspender cuentas de usuarios', 'usuarios'),
('ver_reportes', 'Ver reportes de usuarios', 'reportes'),
('gestionar_reportes', 'Gestionar y resolver reportes', 'reportes'),
('aplicar_sanciones', 'Aplicar sanciones a usuarios', 'sanciones'),
('ver_viajes', 'Ver todos los viajes', 'viajes'),
('cancelar_viajes', 'Cancelar viajes', 'viajes'),
('ver_pagos', 'Ver transacciones y pagos', 'pagos'),
('gestionar_retiros', 'Aprobar/rechazar retiros', 'pagos'),
('ver_estadisticas', 'Ver estadísticas y reportes', 'reportes'),
('gestionar_comisiones', 'Configurar comisiones', 'configuracion'),
('gestionar_cupones', 'Crear y gestionar cupones', 'promociones'),
('verificar_documentos', 'Verificar documentos de conductores', 'verificacion'),
('configurar_app', 'Modificar configuración de la app', 'configuracion');

-- Asignar todos los permisos al rol administrador
INSERT INTO roles_permisos (rol, id_permiso)
SELECT 'administrador', id_permiso FROM permisos;

-- Configuración inicial de comisiones
INSERT INTO configuracion_comisiones (tipo_servicio, porcentaje_comision, monto_minimo, activo) VALUES
('estandar', 15.00, 0.50, true);

-- Configuración inicial de la app
INSERT INTO configuracion_app (clave, valor, tipo_dato, descripcion, categoria) VALUES
('radio_busqueda_km', '50', 'number', 'Radio de búsqueda de rutas en kilómetros', 'general'),
('tiempo_expiracion_oferta_min', '30', 'number', 'Tiempo de expiración de ofertas en minutos', 'general'),
('max_pasajeros_por_vehiculo', '4', 'number', 'Máximo de pasajeros por vehículo', 'general'),
('requiere_verificacion_conductor', 'true', 'boolean', 'Requiere verificación de documentos para conductores', 'seguridad'),
('permitir_pagos_efectivo', 'true', 'boolean', 'Permitir pagos en efectivo', 'pagos'),
('notificaciones_push_habilitadas', 'true', 'boolean', 'Habilitar notificaciones push', 'notificaciones');
