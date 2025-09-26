const { Router } = require("express");
const controller = require("../controllers/couponBooks.controller");

const router = Router();

router.get("/", controller.list);
router.get("/:id", controller.get);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.post(
  "/:id/pause",
  controller.pause
);
router.post(
  "/:id/archive",
  controller.archive
);
router.post(
  "/:id/reactivate",
  controller.reactivate
);
router.post(
  "/:id/codes",
  controller.enqueueCodesJob
);

module.exports = router;
