const express = require("express");
const router = express.Router();
const controller = require("../controllers/bullMonitor.controller");

// GET /v1/bull-monitor/stats - Obtener estadísticas generales
router.get("/stats", controller.getStats);

// GET /v1/bull-monitor/jobs - Obtener lista de jobs
router.get("/jobs", controller.getJobs);

// GET /v1/bull-monitor/job/:id - Obtener detalles de un job específico
router.get("/job/:id", controller.getJobDetails);

// POST /v1/bull-monitor/job/:id/pause - Pausar un job
router.post("/job/:id/pause", controller.pauseJob);

// POST /v1/bull-monitor/job/:id/resume - Reanudar un job
router.post("/job/:id/resume", controller.resumeJob);

// POST /v1/bull-monitor/job/:id/retry - Reintentar un job fallido
router.post("/job/:id/retry", controller.retryJob);

// DELETE /v1/bull-monitor/job/:id - Eliminar un job
router.delete("/job/:id", controller.deleteJob);

// DELETE /v1/bull-monitor/clear-all - Limpiar todos los jobs
router.delete("/clear-all", controller.clearAllJobs);

module.exports = router;
