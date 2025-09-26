"use strict";

const fs = require("fs");
const path = require("path");
const {
  Sequelize,
} = require("sequelize");
const basename =
  path.basename(__filename);
const env =
  process.env.NODE_ENV || "development";
const config = require(
  __dirname + "/../config/config.json"
)[env];

const db = {};
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    ...config,
    logging: false,
    // Configuración del pool de conexiones
    pool: {
      max: 20,                    // Máximo 20 conexiones
      min: 5,                     // Mínimo 5 conexiones
      acquire: 30000,             // 30 segundos para obtener conexión
      idle: 10000,                // 10 segundos antes de cerrar conexión inactiva
      evict: 1000,                // Verificar conexiones cada 1 segundo
      handleDisconnects: true     // Reconectar automáticamente
    },
    // Configuraciones adicionales
    dialectOptions: {
      statement_timeout: 10000,   // 10 segundos timeout por query
      query_timeout: 10000,       // 10 segundos timeout por query
    }
  }
);

fs.readdirSync(__dirname)
  .filter(
    file =>
      file !== basename &&
      file.endsWith(".js")
  )
  .forEach(file => {
    const model = require(
      path.join(__dirname, file)
    )(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
