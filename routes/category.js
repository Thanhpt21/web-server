const express = require("express");
const router = express.Router();
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
const uploader = require("../config/cloudinary.config");
const {
  createCategory,
  getCategory,
  getCategories,
  getCategorys,
  updateCategory,
  deleteCategory,
  uploadImageCategory,
} = require("../controllers/category");

router.post(
  "/",
  [verifyAccessToken, isAdmin],
  uploader.single("images"),
  createCategory
);
router.put(
  "/:cid",
  [verifyAccessToken, isAdmin],
  uploader.single("images"),
  updateCategory
);
router.put(
  "/uploadimage/:cid",
  [verifyAccessToken, isAdmin],
  uploader.single("images"),
  uploadImageCategory
);

router.delete("/:cid", [verifyAccessToken, isAdmin], deleteCategory);
router.get("/", getCategories);
router.get("/get", getCategorys);
router.get("/:cid", getCategory);

module.exports = router;
