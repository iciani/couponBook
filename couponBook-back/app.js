"use strict";

const express = require("express");
const cors = require("cors");
const listRoutes = require('express-list-routes');
const {
  authenticateToken,
} = require("./middleware/auth");
const { sequelize } = require("./models");

// Bull Board para monitoreo de colas
const { serverAdapter } = require("./lib/bullBoard");

// Importar rutas
const couponBooksRoutes = require("./routes/couponBooks.routes");
const couponCodesRoutes = require("./routes/couponCodes.routes");
const couponAssignmentsRoutes = require("./routes/couponAssignments.routes");
const couponRedemptionsRoutes = require("./routes/couponRedemptions.routes");
const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes");
const bullMonitorRoutes = require("./routes/bullMonitor.routes");

const app = express();

// Middleware global
app.use(cors());
app.use(
  express.json({ limit: "10mb" })
);
app.use(
  express.urlencoded({ extended: true })
);

// Middleware de logging básico
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path}`
  );
  next();
});

// Dashboard de Bull Board (sin autenticación para facilitar monitoreo)
app.use('/admin/queues', serverAdapter.getRouter());

// Rutas de la API
app.use("/v1/auth", authRoutes); // Rutas de autenticación sin protección

// Rutas protegidas con JWT
app.use("/v1/coupon-books",authenticateToken,couponBooksRoutes);
app.use("/v1/coupon-codes",authenticateToken,couponCodesRoutes);
app.use("/v1/coupon-assignments",authenticateToken,couponAssignmentsRoutes);
app.use("/v1/coupon-redemptions",authenticateToken,couponRedemptionsRoutes);
app.use("/v1/users",authenticateToken,userRoutes);
app.use("/v1/bull-monitor",authenticateToken,bullMonitorRoutes);

// Ruta de salud
app.get("/health", async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    await sequelize.authenticate();
    
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      service: "coupon-book-api",
      services: {
        database: "Connected",
        redis: "Connected",
        queues: "Active"
      },
      database: {
        pool: {
          totalConnections: sequelize.connectionManager.pool.size,
          usedConnections: sequelize.connectionManager.pool.used,
          availableConnections: sequelize.connectionManager.pool.available,
          waitingRequests: sequelize.connectionManager.pool.pending
        }
      },
      dashboard: {
        url: "/admin/queues",
        description: "Bull Board - Queue Monitoring Dashboard"
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      service: "coupon-book-api",
      error: error.message
    });
  }
});

// Endpoint para listar todas las rutas automáticamente
app.get("/api-routes", (req, res) => {
  const routes = listRoutes(app, { 
    showMethods: true,
    showPrefix: false 
  });
  
  // Filtrar solo las rutas de la API v1
  const apiRoutes = routes.filter(route => route.path.startsWith('/v1/'));
  
  res.json({
    message: "Coupon Book API - All Routes",
    version: "1.0.0",
    total_routes: apiRoutes.length,
    routes: apiRoutes,
    endpoints: {
      health: "GET /health - Estado de salud del sistema",
      routes: "GET /api-routes - Lista automática de todas las rutas",
      dashboard: "GET /admin/queues - Dashboard de monitoreo de colas",
      docs: "GET / - Documentación básica de endpoints"
    }
  });
});

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    message: "Coupon Book API",
    version: "1.0.0",
    endpoints: {
      // Books
      "books": "GET /v1/coupon-books - Listar todos los books de cupones",
      "books-create": "POST /v1/coupon-books - Crear nuevo book de cupones",
      "books-get": "GET /v1/coupon-books/:id - Obtener book específico",
      "books-update": "PATCH /v1/coupon-books/:id - Actualizar book",
      "books-pause": "POST /v1/coupon-books/:id/pause - Pausar book",
      "books-archive": "POST /v1/coupon-books/:id/archive - Archivar book",
      "books-reactivate": "POST /v1/coupon-books/:id/reactivate - Reactivar book",
      "books-generate": "POST /v1/coupon-books/:id/codes - Generar códigos para book",
      
      // Codes
      "codes": "GET /v1/coupon-codes - Listar códigos de cupones (con paginación)",
      "codes-get": "GET /v1/coupon-codes/:id - Obtener código específico",
      "codes-generate": "POST /v1/coupon-codes/generate - Generar códigos masivamente",
      "codes-disable": "PATCH /v1/coupon-codes/:id/disable - Deshabilitar código",
      "codes-enable": "PATCH /v1/coupon-codes/:id/enable - Habilitar código",
      "codes-job-status": "GET /v1/coupon-codes/job/:jobId - Estado de job de generación",
      "codes-jobs": "GET /v1/coupon-codes/jobs - Listar jobs de generación",
      
      // Assignments
      "assignments": "GET /v1/coupon-assignments/:id - Obtener asignación específica",
      "assignments-random": "POST /v1/coupon-assignments/random - Asignar cupones aleatorios a usuario",
      "assignments-specific": "POST /v1/coupon-assignments/specific - Asignar cupón específico a usuario",
      "assignments-user": "GET /v1/coupon-assignments/user/:userId - Obtener cupones asignados a usuario",
      "assignments-unassign": "DELETE /v1/coupon-assignments/:id - Desasignar cupón",
      
      // Redemptions
      "redemptions": "GET /v1/coupon-redemptions - Listar canjes realizados (con paginación)",
      "redemptions-lock": "POST /v1/coupon-redemptions/lock/:code - Bloquear cupón temporalmente (3 min)",
      "redemptions-unlock": "DELETE /v1/coupon-redemptions/lock/:code - Liberar bloqueo de cupón",
      "redemptions-redeem": "POST /v1/coupon-redemptions/redeem/:code - Canjear cupón bloqueado",
      
      // Users
      "users": "GET /v1/users - Listar usuarios del sistema",
      "users-create": "POST /v1/users - Crear nuevo usuario",
      "users-get": "GET /v1/users/:id - Obtener usuario específico",
      "users-update": "PATCH /v1/users/:id - Actualizar usuario",
      "users-delete": "DELETE /v1/users/:id - Eliminar usuario",
      
      // Otros endpoints
      "auth": "POST /v1/auth/login - Iniciar sesión de usuario",
      "bull-monitor": "GET /v1/bull-monitor - Monitoreo de colas y trabajos",
      "bull-monitor-stats": "GET /v1/bull-monitor/stats - Estadísticas de colas",
      "bull-monitor-jobs": "GET /v1/bull-monitor/jobs - Listar jobs en colas",
      "bull-monitor-job": "GET /v1/bull-monitor/job/:id - Detalles de job específico",
      "bull-monitor-pause": "POST /v1/bull-monitor/job/:id/pause - Pausar job",
      "bull-monitor-resume": "POST /v1/bull-monitor/job/:id/resume - Reanudar job",
      "bull-monitor-retry": "POST /v1/bull-monitor/job/:id/retry - Reintentar job fallido",
      "bull-monitor-delete": "DELETE /v1/bull-monitor/job/:id - Eliminar job",
      "bull-monitor-clear": "DELETE /v1/bull-monitor/clear-all - Limpiar todos los jobs"
    },
    monitoring: {
      health: "/health",
      dashboard: "/admin/queues",
      description: "Queue monitoring and job management"
    }
  });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (err.statusCode) {
    return res
      .status(err.statusCode)
      .json({
        error: err.message,
        details: err.details,
      });
  }

  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV ===
      "production"
        ? "Something went wrong"
        : err.message,
    stack:
      process.env.NODE_ENV !==
      "production"
        ? err.stack
        : undefined,
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

module.exports = app;
