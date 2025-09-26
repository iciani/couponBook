const { Router } = require("express");
const controller = require("../controllers/auth.controller");
const {
  authenticateToken,
} = require("../middleware/auth");

const router = Router();

// Rutas públicas
router.post("/login", controller.login);

// Rutas protegidas
router.get(
  "/me",
  authenticateToken,
  controller.me
);
router.post(
  "/refresh",
  authenticateToken,
  controller.refresh
);

module.exports = router;
