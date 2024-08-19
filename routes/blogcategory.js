const express = require("express");
const router = express.Router();
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
const {
  createBlogCategory,
  getBlogCategory,
  getBlogCategories,
  getBlogCategorys,
  updateBlogCategory,
  deleteBlogCategory,
} = require("../controllers/blogcategory");

router.post("/", verifyAccessToken, isAdmin, createBlogCategory);

router.get("/get", getBlogCategorys);
router.get("/", getBlogCategories);
router.get("/:bcid", getBlogCategory);
router.put("/:bcid", [verifyAccessToken, isAdmin], updateBlogCategory);
router.delete("/:bcid", [verifyAccessToken, isAdmin], deleteBlogCategory);

module.exports = router;
