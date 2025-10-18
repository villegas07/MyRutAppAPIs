-- ============================================
-- DATOS INICIALES Y VISTAS
-- ============================================
-- Ejecutar este script DESPUÉS de prisma migrate dev
-- Comando: psql -U tu_usuario -d transporte_db -f prisma/seed-data.sql

-- ============================================
-- DATOS INICIALES
-- ============================================

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
('configurar_app', 'Modificar configuración de la app', 'configuracion')
ON CONFLICT (nombre_permiso) DO NOTHING;

-- Asignar todos los permisos al rol administrador
INSERT INTO roles_permisos (rol, id_permiso)
SELECT 'administrador', id_permiso FROM permisos
ON CONFLICT DO NOTHING;

-- Configuración inicial de comisiones
INSERT INTO configuracion_comisiones (tipo_servicio, porcentaje_comision, monto_minimo, activo) VALUES
('estandar', 15.00, 0.50, true)
ON CONFLICT DO NOTHING;

-- Configuración inicial de la app
INSERT INTO configuracion_app (clave, valor, tipo_dato, descripcion, categoria) VALUES
('radio_busqueda_km', '50', 'number', 'Radio de búsqueda de rutas en kilómetros', 'general'),
('tiempo_expiracion_oferta_min', '30', 'number', 'Tiempo de expiración de ofertas en minutos', 'general'),
('max_pasajeros_por_vehiculo', '4', 'number', 'Máximo de pasajeros por vehículo', 'general'),
('requiere_verificacion_conductor', 'true', 'boolean', 'Requiere verificación de documentos para conductores', 'seguridad'),
('permitir_pagos_efectivo', 'true', 'boolean', 'Permitir pagos en efectivo', 'pagos'),
('notificaciones_push_habilitadas', 'true', 'boolean', 'Habilitar notificaciones push', 'notificaciones')
ON CONFLICT (clave) DO NOTHING;

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de rutas disponibles con información del conductor
CREATE OR REPLACE VIEW vista_rutas_disponibles AS
SELECT 
    r.*,
    u.nombre || ' ' || u.apellido AS nombre_conductor,
    u.calificacion_conductor,
    u.foto_perfil,
    v.marca || ' ' || v.modelo AS vehiculo,
    v.color,
    v.placa,
    v.capacidad_pasajeros
FROM rutas r
JOIN usuarios u ON r.id_conductor = u.id_usuario
JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
WHERE r.estado = 'publicada' 
AND r.asientos_disponibles > r.asientos_ocupados
AND r.fecha_salida > CURRENT_TIMESTAMP;

-- Vista de viajes activos
CREATE OR REPLACE VIEW vista_viajes_activos AS
SELECT 
    v.*,
    uc.nombre || ' ' || uc.apellido AS nombre_conductor,
    up.nombre || ' ' || up.apellido AS nombre_pasajero,
    uc.telefono AS telefono_conductor,
    up.telefono AS telefono_pasajero,
    ve.marca || ' ' || ve.modelo AS vehiculo,
    ve.placa
FROM viajes v
JOIN usuarios uc ON v.id_conductor = uc.id_usuario
JOIN usuarios up ON v.id_pasajero = up.id_usuario
JOIN vehiculos ve ON v.id_vehiculo = ve.id_vehiculo
WHERE v.estado IN ('confirmado', 'en_curso');

-- Vista de reportes pendientes (para administradores)
CREATE OR REPLACE VIEW vista_reportes_pendientes AS
SELECT 
    r.*,
    u1.nombre || ' ' || u1.apellido AS nombre_reportante,
    u1.email AS email_reportante,
    u2.nombre || ' ' || u2.apellido AS nombre_reportado,
    u2.email AS email_reportado,
    u2.estado_cuenta AS estado_cuenta_reportado,
    u3.nombre || ' ' || u3.apellido AS admin_asignado
FROM reportes r
JOIN usuarios u1 ON r.id_reportante = u1.id_usuario
JOIN usuarios u2 ON r.id_reportado = u2.id_usuario
LEFT JOIN usuarios u3 ON r.id_admin_asignado = u3.id_usuario
WHERE r.estado IN ('pendiente', 'en_revision')
ORDER BY r.prioridad DESC, r.fecha_reporte ASC;

-- Vista de dashboard admin
CREATE OR REPLACE VIEW vista_dashboard_admin AS
SELECT 
    (SELECT COUNT(*) FROM usuarios WHERE estado_cuenta = 'activo') AS usuarios_activos,
    (SELECT COUNT(*) FROM usuarios WHERE rol = 'usuario' AND total_viajes_conductor > 0) AS conductores_totales,
    (SELECT COUNT(*) FROM rutas WHERE estado = 'publicada') AS rutas_activas,
    (SELECT COUNT(*) FROM viajes WHERE estado IN ('confirmado', 'en_curso')) AS viajes_en_curso,
    (SELECT COUNT(*) FROM viajes WHERE estado = 'completado' AND DATE(fecha_confirmacion) = CURRENT_DATE) AS viajes_hoy,
    (SELECT COUNT(*) FROM reportes WHERE estado = 'pendiente') AS reportes_pendientes,
    (SELECT COUNT(*) FROM retiros WHERE estado = 'pendiente') AS retiros_pendientes,
    (SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE estado = 'completado' AND DATE(fecha_pago) = CURRENT_DATE) AS ingresos_hoy,
    (SELECT COALESCE(SUM(comision_plataforma), 0) FROM pagos WHERE estado = 'completado' AND DATE(fecha_pago) = CURRENT_DATE) AS comisiones_hoy;

-- Vista de usuarios con sanciones activas
CREATE OR REPLACE VIEW vista_usuarios_sancionados AS
SELECT 
    u.id_usuario,
    u.nombre || ' ' || u.apellido AS nombre_completo,
    u.email,
    u.telefono,
    s.tipo_sancion,
    s.razon,
    s.fecha_inicio,
    s.fecha_fin,
    a.nombre || ' ' || a.apellido AS admin_sancionador
FROM usuarios u
JOIN sanciones s ON u.id_usuario = s.id_usuario
JOIN usuarios a ON s.id_admin = a.id_usuario
WHERE s.estado = 'activa' AND (s.fecha_fin IS NULL OR s.fecha_fin > CURRENT_TIMESTAMP);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que los datos se insertaron correctamente
SELECT 'Permisos insertados:' AS info, COUNT(*) AS total FROM permisos;
SELECT 'Roles-Permisos asignados:' AS info, COUNT(*) AS total FROM roles_permisos;
SELECT 'Comisiones configuradas:' AS info, COUNT(*) AS total FROM configuracion_comisiones;
SELECT 'Configuraciones de app:' AS info, COUNT(*) AS total FROM configuracion_app;

-- Listar vistas creadas
SELECT 'Vistas creadas:' AS info;
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'vista_%';
