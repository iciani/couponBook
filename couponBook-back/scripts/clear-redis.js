#!/usr/bin/env node

/**
 * Script para limpiar completamente Redis
 * Elimina todas las claves relacionadas con Bull Queue y la aplicación
 */

const redis = require('../lib/redis');

async function clearRedis() {
  const client = redis;

  try {
    await client.connect();
    console.log('✅ Conectado a Redis');

    // Obtener todas las claves
    const keys = await client.keys('*');
    console.log(`📊 Encontradas ${keys.length} claves en Redis`);

    if (keys.length === 0) {
      console.log('✨ Redis ya está limpio');
      return;
    }

    // Mostrar las claves que se van a eliminar
    console.log('🗑️  Claves a eliminar:');
    keys.forEach(key => console.log(`   - ${key}`));

    // Eliminar todas las claves
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`✅ Eliminadas ${keys.length} claves de Redis`);
    }

    // Verificar que esté limpio
    const remainingKeys = await client.keys('*');
    console.log(`✨ Redis limpio. Claves restantes: ${remainingKeys.length}`);

  } catch (error) {
    console.error('❌ Error limpiando Redis:', error);
    process.exit(1);
  } finally {
    client.disconnect();
    console.log('🔌 Desconectado de Redis');
  }
}

// Ejecutar el script
clearRedis();
