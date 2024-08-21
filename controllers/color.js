const Color = require("../models/color");
const asyncHandler = require("express-async-handler");

const createColor = asyncHandler(async (req, res) => {
  const { title, code } = req.body;
  if (!title && !code) throw new Error("Missing input");
  const response = await Color.create(req.body);
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Tạo thành công" : "Đã xảy ra lỗi",
  });
});

const getColors = asyncHandler(async (req, res) => {
  const queryObj = { ...req.query };
  const excludeFields = ["page", "sort", "limit", "fields"];
  excludeFields.forEach((el) => delete queryObj[el]);
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  let formatedQueryObj = JSON.parse(queryStr);

  if (queryObj?.title)
    formatedQueryObj.title = { $regex: queryObj.title, $options: "i" };

  if (req.query.q) {
    delete formatedQueryObj.q;
    formatedQueryObj["$or"] = [
      { title: { $regex: req.query.q, $options: "i" } },
    ];
  }

  let query = Color.find(formatedQueryObj);

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
    const counts = await Color.find(formatedQueryObj).countDocuments();
    res.status(200).json({
      success: response ? true : false,
      colors: response ? response : "Đã xảy ra lỗi",
      counts,
    });
  });
});

const getAllColors = asyncHandler(async (req, res) => {
  const response = await Color.find();
  res.status(200).json({
    success: response ? true : false,
    colors: response ? response : "Đã xảy ra lỗi",
  });
});

const getColor = asyncHandler(async (req, res) => {
  const { cid } = req.params;
  const response = await Color.findById(cid);
  res.status(200).json({
    success: response ? true : false,
    colors: response ? response : "Đã xảy ra lỗi",
  });
});

const updateColor = asyncHandler(async (req, res) => {
  const { cid } = req.params;
  const response = await Color.findByIdAndUpdate(cid, req.body, {
    new: true,
  });
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Cập nhật thành công" : "Đã xảy ra lỗi",
  });
});

const deleteColor = asyncHandler(async (req, res) => {
  const { cid } = req.params;
  const response = await Color.findByIdAndDelete(cid);
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Xóa thành công" : "Đã xảy ra lỗi",
  });
});

module.exports = {
  createColor,
  getColors,
  getColor,
  updateColor,
  deleteColor,
  getAllColors,
};
