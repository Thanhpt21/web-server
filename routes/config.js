const express = require("express");
const router = express.Router();
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
const uploader = require("../config/cloudinary.config");
const {
  createConfig,
  updateConfig,
  getConfigs,
} = require("../controllers/config");

router.post("/", verifyAccessToken, isAdmin, createConfig);
router.put(
  "/:cid",
  [verifyAccessToken, isAdmin],
  uploader.fields([
    {
      name: "logo",
      maxCount: 1,
    },
    {
      name: "favicon",
      maxCount: 1,
    },
  ]),
  updateConfig
);
router.get("/", getConfigs);

module.exports = router;
