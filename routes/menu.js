const express = require("express");
const router = express.Router();
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
const {
  createMenu,
  getMenus,
  updateMenu,
  deleteMenu,
} = require("../controllers/menu");

router.post("/", verifyAccessToken, isAdmin, createMenu);

router.get("/", getMenus);
// router.get("/:id", getMenu);
router.put("/:id", [verifyAccessToken, isAdmin], updateMenu);
router.delete("/:id", [verifyAccessToken, isAdmin], deleteMenu);

module.exports = router;
