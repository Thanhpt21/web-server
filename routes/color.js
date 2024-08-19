const express = require("express");
const router = express.Router();
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
const {
  createColor,
  getColor,
  getColors,
  updateColor,
  deleteColor,
  getAllColors,
} = require("../controllers/color");

router.post("/", verifyAccessToken, isAdmin, createColor);

router.get("/", getColors);
router.get("/getall", getAllColors);
router.get("/:cid", getColor);
router.put("/:cid", [verifyAccessToken, isAdmin], updateColor);
router.delete("/:cid", [verifyAccessToken, isAdmin], deleteColor);

module.exports = router;
