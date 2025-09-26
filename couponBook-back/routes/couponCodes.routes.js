const { Router } = require("express");
const controller = require("../controllers/couponCodes.controller");

const router = Router();

// Listar códigos (con filtros opcionales: bookId, status)
router.get("/", controller.list);

// Obtener un código puntual
router.get("/:id", controller.get);

// Cambiar estado de un código
router.patch(
  "/:id/disable",
  controller.disable
);
router.patch(
  "/:id/enable",
  controller.enable
);

// Generar códigos para un book
router.post(
  "/generate",
  controller.generateCodes
);

// Consultar estado de un job
router.get(
  "/job/:jobId",
  controller.getJobStatus
);

// Listar jobs
router.get(
  "/jobs",
  controller.listJobs
);

module.exports = router;
