const Queue = require('bull');
const Redis = require('ioredis');

// Configuración de Redis
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
};

// Cliente Redis
const redis = new Redis(redisConfig);

// Cola para generar códigos de cupones
const codeGenerationQueue = new Queue('code generation', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 10, // Mantener solo los últimos 10 jobs completados
    removeOnFail: 5,      // Mantener solo los últimos 5 jobs fallidos
    attempts: 3,          // Reintentar hasta 3 veces
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Event listeners para monitoreo
codeGenerationQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed: Generated ${result.generatedCount} codes for book ${job.data.bookId}`);
});

codeGenerationQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

codeGenerationQueue.on('stalled', (job) => {
  console.warn(`Job ${job.id} stalled`);
});

module.exports = {
  codeGenerationQueue,
  redis,
};
