const Ship = require("../models/ship");
const asyncHandler = require("express-async-handler");

const createShip = asyncHandler(async (req, res) => {
  console.log(req.body);
  const { province, price } = req.body;
  if (!province && !price) throw new Error("Missing input");
  const response = await Ship.create(req.body);
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Tạo thành công" : "Đã xảy ra lỗi",
  });
});

const getShips = asyncHandler(async (req, res) => {
  const queryObj = { ...req.query };
  const excludeFields = ["page", "sort", "limit", "fields"];
  excludeFields.forEach((el) => delete queryObj[el]);
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  let formatedQueryObj = JSON.parse(queryStr);

  if (queryObj?.province)
    formatedQueryObj.province = { $regex: queryObj.province, $options: "i" };

  if (req.query.q) {
    delete formatedQueryObj.q;
    formatedQueryObj["$or"] = [
      { province: { $regex: req.query.q, $options: "i" } },
    ];
  }

  let query = Ship.find(formatedQueryObj);

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
    const counts = await Ship.find(formatedQueryObj).countDocuments();
    res.status(200).json({
      success: response ? true : false,
      ships: response ? response : "Đã xảy ra lỗi",
      counts,
    });
  });
});

const getAllShips = asyncHandler(async (req, res) => {
  const response = await Ship.find();
  res.status(200).json({
    success: response ? true : false,
    ships: response ? response : "Đã xảy ra lỗi",
  });
});

const getShip = asyncHandler(async (req, res) => {
  const { sid } = req.params;
  const response = await Ship.findById(sid);
  res.status(200).json({
    success: response ? true : false,
    ships: response ? response : "Đã xảy ra lỗi",
  });
});

const updateShip = asyncHandler(async (req, res) => {
  const { sid } = req.params;
  const response = await Ship.findByIdAndUpdate(sid, req.body, {
    new: true,
  });
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Cập nhật thành công" : "Đã xảy ra lỗi",
  });
});

const deleteShip = asyncHandler(async (req, res) => {
  const { sid } = req.params;
  const response = await Ship.findByIdAndDelete(sid);
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Xóa thành công" : "Đã xảy ra lỗi",
  });
});

module.exports = {
  createShip,
  getShips,
  getShip,
  updateShip,
  deleteShip,
  getAllShips,
};
