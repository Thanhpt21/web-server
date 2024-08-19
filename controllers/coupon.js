const Coupon = require("../models/coupon");
const asyncHandler = require("express-async-handler");

const createCoupon = asyncHandler(async (req, res) => {
  console.log(req.body);
  const { name, discount, expiry, usageLimit, usedCount, minPrice } = req.body;
  if (!name || !discount || !expiry || !minPrice || usageLimit === undefined) {
    throw new Error("Missing input");
  }
  const response = await Coupon.create({
    name: name.toUpperCase(), // Đảm bảo trường name được lưu dưới dạng chữ hoa
    discount,
    minPrice,
    expiry: new Date(expiry),
    usageLimit,
    usedCount: usedCount || 0, // Nếu usedCount không có, mặc định là 0
  });
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Tạo thành công" : "Đã xảy ra lỗi",
  });
});

const useCoupon = asyncHandler(async (req, res) => {
  try {
    const { cid } = req.params;
    const coupon = await Coupon.findById(cid);

    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon không tìm thấy" });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon đã đạt giới hạn sử dụng" });
    }

    // Trả về mã giảm giá mà không cập nhật usedCount
    res.status(200).json({
      success: true,
      message: "Coupon sẵn sàng sử dụng",
      discount: coupon.discount,
      couponId: coupon._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Đã xảy ra lỗi" });
  }
});

const updateUsedCount = asyncHandler(async (req, res) => {
  try {
    const { cid } = req.params;
    const coupon = await Coupon.findById(cid);

    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon không tìm thấy" });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon đã đạt giới hạn sử dụng" });
    }

    // Cập nhật usedCount
    coupon.usedCount += 1;
    await coupon.save();

    res.status(200).json({
      success: true,
      message: "Coupon đã được cập nhật",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Đã xảy ra lỗi" });
  }
});

const getCoupons = asyncHandler(async (req, res) => {
  const queryObj = { ...req.query };
  const excludeFields = ["page", "sort", "limit", "fields"];
  excludeFields.forEach((el) => delete queryObj[el]);
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  let formatedQueryObj = JSON.parse(queryStr);

  if (req.query.q) {
    delete formatedQueryObj.q;
    formatedQueryObj["$or"] = [
      { name: { $regex: req.query.q, $options: "i" } },
      { discount: { $regex: req.query.q, $options: "i" } },
    ];
  }

  let query = Coupon.find(formatedQueryObj);

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
    const counts = await Coupon.find(formatedQueryObj).countDocuments();
    res.status(200).json({
      success: response ? true : false,
      coupons: response ? response : "Đã xảy ra lỗi",
      counts,
    });
  });
});

const getAllCoupons = asyncHandler(async (req, res) => {
  const response = await Coupon.find();
  res.status(200).json({
    success: response ? true : false,
    coupons: response ? response : "Đã xảy ra lỗi",
  });
});

const getCoupon = asyncHandler(async (req, res) => {
  const { cid } = req.params;
  const response = await Coupon.findById(cid);
  res.status(200).json({
    success: response ? true : false,
    couponData: response ? response : "Đã xảy ra lỗi",
  });
});

const updateCoupon = asyncHandler(async (req, res) => {
  console.log(req.body);
  const { cid } = req.params;
  const { name, discount, expiry, usageLimit, usedCount, minPrice } = req.body;
  if (
    !cid ||
    (Object.keys(req.body).length === 0 &&
      !minPrice &&
      !name &&
      !discount &&
      !expiry &&
      !usageLimit &&
      usedCount === undefined)
  ) {
    throw new Error("Missing input");
  }

  const updateFields = {};
  if (name) updateFields.name = name.toUpperCase(); // Đảm bảo trường name được lưu dưới dạng chữ hoa
  if (discount) updateFields.discount = discount;
  if (minPrice) updateFields.minPrice = minPrice;
  if (expiry) updateFields.expiry = new Date(expiry);
  if (usageLimit !== undefined) updateFields.usageLimit = usageLimit;
  if (usedCount !== undefined) updateFields.usedCount = usedCount;

  const response = await Coupon.findByIdAndUpdate(cid, updateFields, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Cập nhật thành công" : "Đã xảy ra lỗi",
  });
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const { cid } = req.params;
  const response = await Coupon.findByIdAndDelete(cid);
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Xóa thành công" : "Đã xảy ra lỗi",
  });
});

module.exports = {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCoupon,
  getCoupons,
  getAllCoupons,
  useCoupon,
  updateUsedCount,
};
