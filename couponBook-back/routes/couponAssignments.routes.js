const { Router } = require("express");
const controller = require("../controllers/couponAssignments.controller");

const router = Router();

router.get("/:id", controller.get);
router.get(
  "/user/:userId",
  controller.listByUser
);
router.post(
  "/random",
  controller.assignRandomCoupons
);
router.post(
  "/specific",
  controller.assignSpecificCoupon
);
router.delete(
  "/:id",
  controller.unassignCoupon
);

module.exports = router;
