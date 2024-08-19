const express = require("express");
const router = express.Router();
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
const uploader = require("../config/cloudinary.config");
const {
  createBlog,
  getBlog,
  getBlogs,
  updateBlog,
  deleteBlog,
  likeBlog,
  dislikeBlog,
  uploadImageBlog,
  getAllBlogs,
} = require("../controllers/blog");

router.post(
  "/",
  [verifyAccessToken, isAdmin],
  uploader.single("images"),
  createBlog
);

router.put(
  "/uploadimage/:bid",
  [verifyAccessToken, isAdmin],
  uploader.single("images"),
  uploadImageBlog
);

router.put(
  "/:bid",
  [verifyAccessToken, isAdmin],
  uploader.single("images"),
  updateBlog
);
router.delete("/:bid", [verifyAccessToken, isAdmin], deleteBlog);

router.put("/like/:bid", verifyAccessToken, likeBlog);
router.put("/dislike/:bid", verifyAccessToken, dislikeBlog);
router.get("/getall", getAllBlogs);
router.get("/", getBlogs);
router.get("/:bid", verifyAccessToken || null, getBlog);

module.exports = router;
