const express = require("express");
const router = express.Router();
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
const uploader = require("../config/cloudinary.config");
const {
  register,
  login,
  current,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  getUsers,
  deleteUser,
  updateUser,
  updateUserByAdmin,
  updateUserAddress,
  updateCart,
  removeProductCart,
  updateWishlist,
} = require("../controllers/user");

router.post("/register", register);
router.post("/login", login);
router.get("/current", verifyAccessToken, current);
router.put(
  "/current",
  verifyAccessToken,
  uploader.single("avatar"),
  updateUser
);
router.put("/address", verifyAccessToken, updateUserAddress);
router.put("/cart", verifyAccessToken, updateCart);
router.delete("/remove-cart/:pid/:color", verifyAccessToken, removeProductCart);

router.post("/refreshtoken", refreshAccessToken);
router.get("/logout", logout);
router.get("/forgotpassword", forgotPassword);
router.put("/resetpassword", resetPassword);
router.get("/", [verifyAccessToken, isAdmin], getUsers);
router.delete("/:uid", [verifyAccessToken, isAdmin], deleteUser);
router.put("/wishlist/:pid", verifyAccessToken, updateWishlist);
router.put("/:uid", [verifyAccessToken, isAdmin], updateUserByAdmin);

module.exports = router;
