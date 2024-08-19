const express = require("express");
const router = express.Router();
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");

const {
  createOrder,
  updateOrderStatus,
  getOrderByUser,
  getOrderByAdmin,
} = require("../controllers/order");

router.post("/", verifyAccessToken, createOrder);
router.get("/", verifyAccessToken, getOrderByUser);
router.get("/allorder", [verifyAccessToken, isAdmin], getOrderByAdmin);
router.put("/status/:oid", [verifyAccessToken, isAdmin], updateOrderStatus);

module.exports = router;
