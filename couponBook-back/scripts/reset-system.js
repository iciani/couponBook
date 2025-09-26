#!/usr/bin/env node

/**
 * Script para resetear completamente el sistema
 * - Limpia todos los jobs de Bull Queue
 * - Limpia Redis
 * - Opcionalmente limpia los códigos generados de la base de datos
 */

const redis = require('../lib/redis');
const { sequelize } = require('../models');

async function resetSystem() {
  console.log('🚀 Iniciando reset del sistema...\n');

  try {
    // 1. Limpiar Bull Queue
    console.log('1️⃣  Limpiando Bull Queue...');
    const { codeGenerationQueue } = require('../lib/queue');
    
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      codeGenerationQueue.getWaiting(),
      codeGenerationQueue.getActive(),
      codeGenerationQueue.getCompleted(),
      codeGenerationQueue.getFailed(),
      codeGenerationQueue.getDelayed(),
    ]);

    const allJobs = [...waiting, ...active, ...completed, ...failed, ...delayed];
    
    if (allJobs.length > 0) {
      const deletePromises = allJobs.map(job => job.remove());
      await Promise.all(deletePromises);
      await codeGenerationQueue.obliterate({ force: true });
      console.log(`   ✅ Eliminados ${allJobs.length} jobs de Bull Queue`);
    } else {
      console.log('   ✨ No hay jobs en Bull Queue');
    }

    // 2. Limpiar Redis
    console.log('\n2️⃣  Limpiando Redis...');
    await redis.connect();
    
    const keys = await redis.keys('*');
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`   ✅ Eliminadas ${keys.length} claves de Redis`);
    } else {
      console.log('   ✨ Redis ya estaba limpio');
    }
    
    await redis.disconnect();

    // 3. Mostrar estadísticas de la base de datos
    console.log('\n3️⃣  Verificando base de datos...');
    const [couponCodesCount, couponBooksCount] = await Promise.all([
      sequelize.query('SELECT COUNT(*) as count FROM coupon_codes', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) as count FROM coupon_books', { type: sequelize.QueryTypes.SELECT })
    ]);

    console.log(`   📊 Códigos de cupones en BD: ${couponCodesCount[0].count}`);
    console.log(`   📊 Books de cupones en BD: ${couponBooksCount[0].count}`);

    // 4. Preguntar si limpiar códigos generados
    const args = process.argv.slice(2);
    if (args.includes('--clear-codes')) {
      console.log('\n4️⃣  Limpiando códigos generados...');
      await sequelize.query('DELETE FROM coupon_codes', { type: sequelize.QueryTypes.DELETE });
      await sequelize.query('UPDATE coupon_books SET codes_count = 0', { type: sequelize.QueryTypes.UPDATE });
      console.log('   ✅ Códigos generados eliminados');
    } else {
      console.log('\n4️⃣  Para limpiar también los códigos generados, ejecuta:');
      console.log('   node scripts/reset-system.js --clear-codes');
    }

    console.log('\n🎉 ¡Sistema reseteado completamente!');
    console.log('\n📋 Resumen:');
    console.log(`   • Jobs eliminados: ${allJobs.length}`);
    console.log(`   • Claves Redis eliminadas: ${keys.length}`);
    console.log(`   • Códigos en BD: ${couponCodesCount[0].count}`);
    console.log(`   • Books en BD: ${couponBooksCount[0].count}`);

  } catch (error) {
    console.error('❌ Error durante el reset:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar el script
resetSystem();
