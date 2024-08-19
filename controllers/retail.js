const Retail = require("../models/retail");
const asyncHandler = require("express-async-handler");

const createRetail = asyncHandler(async (req, res) => {
  const { name, mobile, link, iframe, address } = req.body;
  if (!name && !mobile && !link && !iframe && !address)
    throw new Error("Missing input");
  const response = await Retail.create(req.body);
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Tạo thành công" : "Đã xảy ra lỗi",
  });
});

const getRetails = asyncHandler(async (req, res) => {
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
      { name: { $regex: req.query.q, $options: "i" } },
    ];
  }

  let query = Retail.find(formatedQueryObj);

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
    const counts = await Retail.find(formatedQueryObj).countDocuments();
    res.status(200).json({
      success: response ? true : false,
      retails: response ? response : "Đã xảy ra lỗi",
      counts,
    });
  });
});

const getAllRetails = asyncHandler(async (req, res) => {
  const response = await Retail.find();
  res.status(200).json({
    success: response ? true : false,
    retails: response ? response : "Đã xảy ra lỗi",
  });
});

const updateRetail = asyncHandler(async (req, res) => {
  const { rid } = req.params;
  const response = await Retail.findByIdAndUpdate(rid, req.body, {
    new: true,
  });
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Cập nhật thành công" : "Đã xảy ra lỗi",
  });
});

const deleteRetail = asyncHandler(async (req, res) => {
  const { rid } = req.params;
  const response = await Ship.findByIdAndDelete(rid);
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Xóa thành công" : "Đã xảy ra lỗi",
  });
});

module.exports = {
  createRetail,
  getRetails,
  updateRetail,
  deleteRetail,
  getAllRetails,
};
