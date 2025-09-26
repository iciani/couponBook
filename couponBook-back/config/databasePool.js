const { Pool } = require('pg');

// Configuración del pool de conexiones
const poolConfig = {
  // Configuración de conexión
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'coupons',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  
  // Configuración del pool
  max: parseInt(process.env.DB_POOL_MAX) || 20,        // Máximo 20 conexiones
  min: parseInt(process.env.DB_POOL_MIN) || 5,         // Mínimo 5 conexiones
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,  // 30 segundos
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000, // 2 segundos
  
  // Configuraciones avanzadas
  statement_timeout: 10000,      // 10 segundos timeout por query
  query_timeout: 10000,          // 10 segundos timeout por query
  application_name: 'coupon-api',
  
  // Configuraciones de SSL (para producción)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Crear el pool
const pool = new Pool(poolConfig);

// Event listeners para monitoreo
pool.on('connect', (client) => {
  console.log('Nueva conexión establecida al pool');
});

pool.on('error', (err, client) => {
  console.error('Error inesperado en cliente inactivo', err);
});

pool.on('remove', (client) => {
  console.log('Conexión removida del pool');
});

// Función para obtener estadísticas del pool
const getPoolStats = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    maxConnections: poolConfig.max,
    minConnections: poolConfig.min
  };
};

// Función para health check del pool
const checkPoolHealth = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    return {
      status: 'healthy',
      timestamp: result.rows[0].now,
      poolStats: getPoolStats()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      poolStats: getPoolStats()
    };
  }
};

module.exports = {
  pool,
  getPoolStats,
  checkPoolHealth
};
