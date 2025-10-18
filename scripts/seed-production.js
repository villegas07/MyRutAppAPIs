#!/usr/bin/env node
/**
 * Script para cargar datos iniciales en la base de datos de producción
 * Ejecutar: node scripts/seed-production.js
 * 
 * Asegúrate de tener DATABASE_URL configurada en las variables de entorno
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedProduction() {
  try {
    console.log('🌱 Iniciando seed de datos de producción...\n');

    // 1. Verificar que no existan datos
    const existingPermisos = await prisma.permiso.count();
    if (existingPermisos > 0) {
      console.log('⚠️  Ya existen datos en la base de datos.');
      console.log('   Si deseas recargar, primero limpia la base de datos.');
      return;
    }

    // 2. Insertar permisos del sistema
    console.log('📝 Insertando permisos...');
    const permisos = [
      { nombre: 'crear_rutas', descripcion: 'Crear rutas como conductor' },
      { nombre: 'ver_rutas', descripcion: 'Ver rutas disponibles' },
      { nombre: 'hacer_ofertas', descripcion: 'Hacer ofertas en rutas' },
      { nombre: 'aceptar_ofertas', descripcion: 'Aceptar ofertas de pasajeros' },
      { nombre: 'realizar_pagos', descripcion: 'Realizar pagos' },
      { nombre: 'calificar_usuarios', descripcion: 'Calificar a otros usuarios' },
      { nombre: 'enviar_mensajes', descripcion: 'Enviar mensajes' },
      { nombre: 'ver_historial', descripcion: 'Ver historial de viajes' },
      { nombre: 'gestionar_vehiculos', descripcion: 'Gestionar vehículos' },
      { nombre: 'gestionar_usuarios', descripcion: 'Gestionar usuarios del sistema' },
      { nombre: 'ver_reportes', descripcion: 'Ver reportes del sistema' },
      { nombre: 'gestionar_sanciones', descripcion: 'Gestionar sanciones' },
      { nombre: 'configurar_comisiones', descripcion: 'Configurar comisiones' },
      { nombre: 'ver_dashboard', descripcion: 'Ver dashboard administrativo' },
      { nombre: 'gestionar_configuracion', descripcion: 'Gestionar configuración de la app' }
    ];

    await prisma.permiso.createMany({ data: permisos });
    console.log(`✅ ${permisos.length} permisos insertados\n`);

    // 3. Obtener IDs de permisos
    const permisosDB = await prisma.permiso.findMany();
    const permisoMap = {};
    permisosDB.forEach(p => { permisoMap[p.nombre] = p.id_permiso; });

    // 4. Asignar permisos a roles
    console.log('🔐 Asignando permisos a roles...');
    const rolesPermisos = [
      // Permisos para rol 'usuario'
      { rol: 'usuario', id_permiso: permisoMap['ver_rutas'] },
      { rol: 'usuario', id_permiso: permisoMap['hacer_ofertas'] },
      { rol: 'usuario', id_permiso: permisoMap['realizar_pagos'] },
      { rol: 'usuario', id_permiso: permisoMap['calificar_usuarios'] },
      { rol: 'usuario', id_permiso: permisoMap['enviar_mensajes'] },
      { rol: 'usuario', id_permiso: permisoMap['ver_historial'] },
      { rol: 'usuario', id_permiso: permisoMap['crear_rutas'] },
      { rol: 'usuario', id_permiso: permisoMap['aceptar_ofertas'] },
      { rol: 'usuario', id_permiso: permisoMap['gestionar_vehiculos'] },
      // Permisos para rol 'administrador'
      { rol: 'administrador', id_permiso: permisoMap['gestionar_usuarios'] },
      { rol: 'administrador', id_permiso: permisoMap['ver_reportes'] },
      { rol: 'administrador', id_permiso: permisoMap['gestionar_sanciones'] },
      { rol: 'administrador', id_permiso: permisoMap['configurar_comisiones'] },
      { rol: 'administrador', id_permiso: permisoMap['ver_dashboard'] },
      { rol: 'administrador', id_permiso: permisoMap['gestionar_configuracion'] }
    ];

    await prisma.rolPermiso.createMany({ data: rolesPermisos });
    console.log(`✅ ${rolesPermisos.length} asignaciones de permisos creadas\n`);

    // 5. Configuración de comisiones
    console.log('💰 Configurando comisiones...');
    await prisma.configuracionComision.create({
      data: {
        porcentaje_comision: 10.00,
        comision_minima: 1000.00,
        activo: true,
        fecha_vigencia: new Date()
      }
    });
    console.log('✅ Configuración de comisiones creada\n');

    // 6. Configuración de la aplicación
    console.log('⚙️  Configurando parámetros de la aplicación...');
    const configuraciones = [
      { clave: 'radio_busqueda_km', valor: '50', descripcion: 'Radio de búsqueda en kilómetros' },
      { clave: 'tiempo_expiracion_oferta_horas', valor: '24', descripcion: 'Tiempo de expiración de ofertas en horas' },
      { clave: 'calificacion_minima_conductor', valor: '3.0', descripcion: 'Calificación mínima para ser conductor' },
      { clave: 'max_pasajeros_por_vehiculo', valor: '4', descripcion: 'Máximo de pasajeros por vehículo' },
      { clave: 'dias_reactivacion_cuenta', valor: '30', descripcion: 'Días para reactivar cuenta desactivada' },
      { clave: 'max_sanciones_antes_suspension', valor: '3', descripcion: 'Máximo de sanciones antes de suspensión' }
    ];

    await prisma.configuracionApp.createMany({ data: configuraciones });
    console.log(`✅ ${configuraciones.length} configuraciones creadas\n`);

    console.log('🎉 ¡Seed completado exitosamente!\n');
    console.log('📊 Resumen:');
    console.log(`   - ${permisos.length} permisos`);
    console.log(`   - ${rolesPermisos.length} asignaciones de roles`);
    console.log(`   - 1 configuración de comisiones`);
    console.log(`   - ${configuraciones.length} configuraciones de app\n`);

  } catch (error) {
    console.error('❌ Error al ejecutar seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar seed
seedProduction()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
