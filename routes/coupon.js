const express = require("express");
const router = express.Router();
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");

const {
  createCoupon,
  getCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  getAllCoupons,
  useCoupon,
  updateUsedCount,
} = require("../controllers/coupon");

router.post("/", [verifyAccessToken, isAdmin], createCoupon);
router.post("/use-coupon/:cid", useCoupon);
router.post("/update-used-count/:cid", updateUsedCount);
router.put("/:cid", [verifyAccessToken, isAdmin], updateCoupon);
router.delete("/:cid", [verifyAccessToken, isAdmin], deleteCoupon);

router.get("/getall", getAllCoupons);
router.get("/", getCoupons);
router.get("/:cid", getCoupon);

module.exports = router;
