const express = require("express");
const router = express.Router();
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
const {
  createEnquiry,
  getEnquiry,
  getEnquirys,
  updateEnquiry,
  deleteEnquiry,
} = require("../controllers/enquiry");

router.post("/", verifyAccessToken, isAdmin, createEnquiry);

router.get("/", getEnquirys);
router.get("/:eid", getEnquiry);
router.put("/:eid", [verifyAccessToken, isAdmin], updateEnquiry);
router.delete("/:eid", [verifyAccessToken, isAdmin], deleteEnquiry);

module.exports = router;
