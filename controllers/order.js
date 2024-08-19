const Order = require("../models/order");
const User = require("../models/user");
const Coupon = require("../models/coupon");
const asyncHandler = require("express-async-handler");

const createOrder = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const {
    products,
    total,
    address,
    methodPayment,
    deliveryMethod,
    coupon,
    ship,
  } = req.body;

  await User.findByIdAndUpdate(_id, { cart: [] });

  const response = await Order.create({
    products,
    total,
    address,
    status: "Đang chờ duyệt",
    orderBy: _id,
    methodPayment,
    deliveryMethod,
    coupon,
    ship,
  });
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Đơn hàng đã được tạo thành công" : "Đã xảy ra lỗi",
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { oid } = req.params;
  const { status } = req.body;

  if (!status) throw new Error("Missing status");
  const response = await Order.findByIdAndUpdate(oid, req.body, { new: true });
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Cập nhật thành công" : "Đã xảy ra lỗi",
  });
});

const getOrderByUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const queryObj = { ...req.query };
  const excludeFields = ["page", "sort", "limit", "fields"];
  excludeFields.forEach((el) => delete queryObj[el]);
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  let formatedQueryObj = JSON.parse(queryStr);

  if (queryObj?.q) {
    delete formatedQueryObj.q;
    formatedQueryObj["$or"] = [
      { status: { $regex: queryObj.q, $options: "i" } },
    ];
  }

  let q = { ...formatedQueryObj, orderBy: _id };
  let query = Order.find(q)
    .populate("orderBy", "firstname lastname email mobile address")
    .populate("coupon", "name discount")
    .populate("ship", "province price");
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
    const counts = await Order.find(q).countDocuments();
    res.status(200).json({
      success: response ? true : false,
      orders: response ? response : "Đã xảy ra lỗi",
      counts,
    });
  });
});

const getOrderByAdmin = asyncHandler(async (req, res) => {
  const queryObj = { ...req.query };
  const excludeFields = ["page", "sort", "limit", "fields"];
  excludeFields.forEach((el) => delete queryObj[el]);
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  let formatedQueryObj = JSON.parse(queryStr);

  // if (queryObj?.q) {
  //   delete formatedQueryObj.q;
  //   formatedQueryObj["$or"] = [
  //     { title: { $regex: queryObj.q, $options: "i" } },
  //   ];
  // }

  let q = { ...formatedQueryObj };
  let query = Order.find(q)
    .populate("orderBy", "firstname lastname email mobile address")
    .populate("coupon", "name discount")
    .populate("ship", "province price")
    .populate({
      path: "products", // Chỉ định trường 'products'
      populate: {
        path: "color", // Chỉ định trường 'color' trong 'products'
        select: "title code", // Chỉ chọn các trường cần thiết (ví dụ: name, hexCode)
      },
    });

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
    const counts = await Order.find(q).countDocuments();
    res.status(200).json({
      success: response ? true : false,
      orders: response ? response : "Đã xảy ra lỗi",
      counts,
    });
  });
});
module.exports = {
  createOrder,
  updateOrderStatus,
  getOrderByUser,
  getOrderByAdmin,
};
