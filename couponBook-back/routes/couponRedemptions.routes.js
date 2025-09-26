const { Router } = require("express");
const controller = require("../controllers/couponRedemptions.controller");

const router = Router();

// Listar canjes
router.get("/", controller.list);

// Lock temporal de cupón
router.post("/lock/:code", controller.lockCoupon);

// Liberar lock manualmente
router.delete("/lock/:code", controller.unlockCoupon);

// Canjear un cupón
router.post("/redeem/:code", controller.redeem);

module.exports = router;