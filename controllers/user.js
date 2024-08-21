const User = require("../models/user");
const asyncHandler = require("express-async-handler");
const { generateAccessToken } = require("../middlewares/jwtToken");
const { generateRefreshToken } = require("../middlewares/refreshToken");
const jwt = require("jsonwebtoken");
const sendMail = require("../ultils/sendMail");
const crypto = require("crypto");
const makeToken = require("uniqid");
const mongoose = require("mongoose");

const register = asyncHandler(async (req, res) => {
  const { email, password, firstname, lastname } = req.body;
  if (!email || !password || !firstname || !lastname)
    return res.status(400).json({
      success: false,
      message: "Dữ liệu không được để trống ",
    });
  const findUser = await User.findOne({ email: email });
  if (!findUser) {
    const response = await User.create(req.body);
    return res.status(200).json({
      success: response ? true : false,
      message: response
        ? "Đăng ký thành công, vui lòng đăng nhập"
        : "Xảy ra lỗi",
    });
  } else {
    throw new Error("Tài khoản đã tồn tại!");
  }
});

// const register = asyncHandler(async (req, res) => {
//   const { email, password, firstname, lastname, mobile } = req.body;
//   if (!email || !password || !firstname || !lastname || !mobile)
//     return res.status(400).json({
//       success: false,
//       message: "Dữ liệu không được để trống ",
//     });
//   const token = makeToken();

//   res.cookie(
//     "dataregister",
//     { ...req.body, token },
//     {
//       httpOnly: true,
//       maxAge: 15 * 60 * 1000,
//     }
//   );
//   const html = `Xin vui lòng click vào link bên dưới để hoàn tất quá trình đăng ký. Link sẽ hết hạn sau 15 phút <a href=${process.env.URL_SERVER}/api/user/finalregister/${token}>Click here</a>`;
//   await sendMail({ email, html, subject: "Hoàn tất đăng ký" });
//   return res.json({
//     success: true,
//     message: "Vui lòng kiểm tra email để kích hoạt tài khoản",
//   });
// });

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({
      success: false,
      message: "Dữ liệu không được để trống ",
    });
  const response = await User.findOne({ email });
  if (response && (await response.isPasswordMatched(password))) {
    const { password, role, refreshToken, ...userData } = response.toObject();
    const accessToken = generateAccessToken(response._id, role);
    const newRefreshToken = generateRefreshToken(response._id);
    await User.findByIdAndUpdate(
      response._id,
      {
        refreshToken: newRefreshToken,
      },
      {
        new: true,
      }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      success: true,
      accessToken,
      userData,
    });
  } else {
    throw new Error("Thông tin đăng nhập không hợp lệ");
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");

  jwt.verify(
    cookie.refreshToken,
    process.env.JWT_SECRET,
    async (err, decode) => {
      if (err) {
        throw new Error("Invalid refresh token");
      }
      const response = await User.findOne({
        _id: decode._id,
        refreshToken: cookie.refreshToken,
      });
      return res.status(200).json({
        success: response ? true : false,
        newAccessToken: response
          ? generateAccessToken(response._id, response.role)
          : "Refresh token not match",
      });
    }
  );
});

const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  await User.findOneAndUpdate(
    { refreshToken: cookie.refreshToken },
    { refreshToken: "" },
    { new: true }
  );
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
  });
  return res.status(200).json({
    success: true,
    message: "Đăng xuất thành công",
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) throw new Error("Email không tồn tại");
  const user = await User.findOne({ email });
  if (!user) throw new Error("Tài khoản không tìm thấy với địa chỉ email này");
  try {
    const resetToken = await user.createPasswordChangedToken();
    await user.save();
    const html = `Xin vui lòng click vào link bên dưới để đổi mật khẩu. Link sẽ hết hạn sau 30 phút <a href=${process.env.URL_SERVER}/api/user/reset-password/${resetToken}>Click here</a>`;
    const data = {
      email,
      html,
      subject: "Forgot password",
    };
    const reset = await sendMail(data);
    return res.status(200).json({
      success: true,
      reset,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  const passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new Error("Token hết hạn, vui lòng thử lại!");
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordChangedAt = Date.now();
  user.passwordResetExpires = undefined;
  await user.save();
  return res.status(200).json({
    success: user ? true : false,
    message: user ? "Password cập nhập thành công" : "Đã xảy ra lỗi",
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const queryObj = { ...req.query };
  const excludeFields = ["page", "sort", "limit", "fields"];
  excludeFields.forEach((el) => delete queryObj[el]);
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  let formatedQueryObj = JSON.parse(queryStr);

  if (queryObj?.name)
    formatedQueryObj.name = { $regex: queryObj.name, $options: "i" };

  if (req.query.q) {
    delete formatedQueryObj.q;
    formatedQueryObj["$or"] = [
      { firstname: { $regex: req.query.q, $options: "i" } },
      { lastname: { $regex: req.query.q, $options: "i" } },
      { email: { $regex: req.query.q, $options: "i" } },
    ];
  }

  let query = User.find(formatedQueryObj);

  //sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }
  //limiting the fields
  if (req.query.fields) {
    const fields = req.query.fields.split(",").join(" ");
    query = query.select(fields);
  } else {
    query = query.select("-__v");
  }

  const page = +req.query.page || 1;
  const limit = +req.query.limit || 4;
  const skip = (page - 1) * limit;
  query = query.skip(skip).limit(limit);
  query.exec(async (err, response) => {
    if (err) throw new Error(err.message);
    const counts = await User.find(formatedQueryObj).countDocuments();
    res.status(200).json({
      success: response ? true : false,
      users: response ? response : "Đã xảy ra lỗi",
      counts,
    });
  });
});

const current = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const user = await User.findById(_id)
    .select("-refreshToken -password")
    .populate("wishlist", "title thumb price color")
    .populate({
      path: "cart",
      populate: [
        {
          path: "product",
          select: "title thumb price category",
          populate: {
            path: "category", // Thêm populate cho trường category
            select: "title", // Chọn trường title từ category
          },
        },
        {
          path: "color",
          select: "title code", // Thêm màu sắc (title và code)
        },
      ],
    })
    .populate({
      path: "wishlist",
      populate: {
        path: "category",
        select: "title",
      },
    });

  return res.status(200).json({
    success: user ? true : false,
    data: user ? user : "Tài khoản không tìm thấy",
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  if (!uid) throw new Error("Missing input");
  try {
    const response = await User.findByIdAndDelete(uid);
    res.status(200).json({
      success: response ? true : false,
      message: response ? "Xóa tài khoản thành công" : "Đã xảy ra lỗi",
    });
  } catch (error) {
    throw new Error(error);
  }
});

const updateUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  const { firstname, lastname, email, mobile, address } = req.body;
  const data = { firstname, lastname, email, mobile, address };
  if (req.file) {
    data.avatar = req.file.path;
  }
  if (!_id || Object.keys(req.body).length === 0)
    throw new Error("Missing input");
  try {
    const response = await User.findByIdAndUpdate(_id, data, {
      new: true,
    }).select("-password -role -refreshToken");
    res.status(200).json({
      success: response ? true : false,
      message: response ? "Cập nhật thành công" : "Đã xảy ra lỗi",
    });
  } catch (error) {
    throw new Error(error);
  }
});

const updateUserByAdmin = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  try {
    const response = await User.findByIdAndUpdate(uid, req.body, {
      new: true,
    }).select("-password -role -refreshToken");
    res.status(200).json({
      success: response ? true : false,
      message: response ? "Cập nhật thành công" : "Đã xảy ra lỗi",
    });
  } catch (error) {
    throw new Error(error);
  }
});

const updateUserAddress = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!req.body.address) throw new Error("Missing input");
  const response = await User.findByIdAndUpdate(
    _id,
    { $push: { address: req.body.address } },
    {
      new: true,
    }
  ).select("-password -role -refreshToken");
  res.status(200).json({
    success: response ? true : false,
    updatedUser: response ? response : "Đã xảy ra lỗi",
  });
});

const updateCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { pid, quantity = 1, color, price, discount, thumb, title } = req.body;
  if (!pid || !color) throw new Error("Missing input");

  const userCart = await User.findById(_id).select("cart");
  const alreadyProduct = userCart?.cart?.find(
    (el) =>
      el.product.toString() === pid.toString() &&
      el.color.toString() === color.toString()
  );

  if (alreadyProduct) {
    const response = await User.updateOne(
      { cart: { $elemMatch: alreadyProduct } },
      {
        $set: {
          "cart.$.quantity": quantity,
          "cart.$.price": price,
          "cart.$.discount": discount,
          "cart.$.thumb": thumb,
          "cart.$.title": title,
        },
      },
      { new: true }
    );
    res.status(200).json({
      success: response ? true : false,
      message: response ? "Cập nhật thành công" : "Đã xảy ra lỗi",
    });
  } else {
    const response = await User.findByIdAndUpdate(
      _id,
      {
        $push: {
          cart: {
            product: pid,
            quantity,
            color,
            price: price,
            discount: discount,
            thumb,
            title,
          },
        },
      },
      {
        new: true,
      }
    );
    res.status(200).json({
      success: response ? true : false,
      message: response ? "Thêm giỏ hàng thành công" : "Đã xảy ra lỗi",
    });
  }
});

const removeProductCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { pid, color } = req.params;

  // Chuyển đổi color thành ObjectId
  const colorId = mongoose.Types.ObjectId(color);

  // Tìm đối tượng trong giỏ hàng với pid và color là ObjectId
  const userCart = await User.findById(_id).select("cart");
  const alreadyProduct = userCart?.cart?.find(
    (el) =>
      el.product.toString() === pid.toString() &&
      el.color.toString() === colorId.toString()
  );

  if (!alreadyProduct) {
    return res.status(200).json({
      success: true,
      message: "Sản phẩm không tồn tại trong giỏ hàng",
    });
  }

  const response = await User.findByIdAndUpdate(
    _id,
    {
      $pull: { cart: { product: pid, color: colorId } },
    },
    {
      new: true,
    }
  );

  res.status(200).json({
    success: response ? true : false,
    message: response ? "Cập nhật thành công" : "Đã xảy ra lỗi",
  });
});

const updateWishlist = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const { _id } = req.user;
  const user = await User.findById(_id);
  const alreadyWishlist = user.wishlist?.find((el) => el.toString() === pid);
  if (alreadyWishlist) {
    const response = await User.findByIdAndUpdate(
      _id,
      {
        $pull: { wishlist: pid },
      },
      {
        new: true,
      }
    );
    return res.status(200).json({
      success: response ? true : false,
      message: response ? "Cập nhật thành công" : "Đã xảy ra lỗi",
    });
  } else {
    const response = await User.findByIdAndUpdate(
      _id,
      {
        $push: { wishlist: pid },
      },
      {
        new: true,
      }
    );
    return res.status(200).json({
      success: response ? true : false,
      message: response ? "Cập nhật thành công" : "Đã xảy ra lỗi",
    });
  }
});

module.exports = {
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
};
