const Category = require("../models/category");
const asyncHandler = require("express-async-handler");

const createCategory = asyncHandler(async (req, res) => {
  const { title, brand } = req.body;
  if (brand) {
    const inputString = req.body.brand;
    const arrayFromSplit = inputString.split(",");
    const transformedArray = arrayFromSplit.map((item) => item);
    req.body.brand = transformedArray;
  }

  const images = req?.file?.path;
  if (!title) throw new Error("Missing input");
  if (images) req.body.images = images;
  const response = await Category.create(req.body);
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Tạo thành công" : "Đã xảy ra lỗi",
  });
});

const getCategories = asyncHandler(async (req, res) => {
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

  let query = Category.find(formatedQueryObj).populate({
    path: "brands",
    select: "title images",
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
    const counts = await Category.find(formatedQueryObj).countDocuments();
    res.status(200).json({
      success: response ? true : false,
      categorys: response ? response : "Đã xảy ra lỗi",
      counts,
    });
  });
});

const getCategorys = asyncHandler(async (req, res) => {
  const response = await Category.find();
  res.status(200).json({
    success: response ? true : false,
    categoryData: response ? response : "Đã xảy ra lỗi",
  });
});

const getCategory = asyncHandler(async (req, res) => {
  const { cid } = req.params;
  const response = await Category.findById(cid).populate("brand");
  res.status(200).json({
    success: response ? true : false,
    categoryData: response ? response : "Đã xảy ra lỗi",
  });
});

const updateCategory = asyncHandler(async (req, res) => {
  const { cid } = req.params;
  if (req.file) {
    req.body.images = req.file.path;
  }

  const { brand } = req.body;

  if (brand) {
    const inputString = req.body.brand;
    const arrayFromSplit = inputString.split(",");
    const transformedArray = arrayFromSplit.map((item) => item);
    req.body.brand = transformedArray;
  }

  const response = await Category.findByIdAndUpdate(cid, req.body, {
    new: true,
  });
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Cập nhật thành công" : "Đã xảy ra lỗi",
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { cid } = req.params;
  const response = await Category.findByIdAndDelete(cid);
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Xóa thành công" : "Đã xảy ra lỗi",
  });
});

const uploadImageCategory = asyncHandler(async (req, res) => {
  const { cid } = req.params;
  if (!req.file) throw new "Missing input"();
  const response = await Category.findByIdAndUpdate(
    cid,
    {
      $push: { images: req.file.path },
    },
    { new: true }
  );
  return res.status(200).json({
    success: response ? true : false,
    updatedCategory: response ? response : "Đã xảy ra lỗi",
  });
});

module.exports = {
  createCategory,
  getCategories,
  getCategorys,
  getCategory,
  updateCategory,
  deleteCategory,
  uploadImageCategory,
};
