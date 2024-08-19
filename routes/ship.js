const express = require("express");
const router = express.Router();
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
const {
  createShip,
  getShip,
  getShips,
  updateShip,
  deleteShip,
  getAllShips,
} = require("../controllers/ship");

router.post("/", verifyAccessToken, isAdmin, createShip);

router.get("/", getShips);
router.get("/getall", getAllShips);
router.get("/:sid", getShip);
router.put("/:sid", [verifyAccessToken, isAdmin], updateShip);
router.delete("/:sid", [verifyAccessToken, isAdmin], deleteShip);

module.exports = router;
