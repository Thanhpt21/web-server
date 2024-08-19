const BlogCategory = require("../models/blogcategory");
const asyncHandler = require("express-async-handler");

const createBlogCategory = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title) throw new Error("Missing input");
  const response = await BlogCategory.create(req.body);
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Tạo thành công" : "Đã xảy ra lỗi",
  });
});

const getBlogCategories = asyncHandler(async (req, res) => {
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

  let query = BlogCategory.find(formatedQueryObj);

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
    const counts = await BlogCategory.find(formatedQueryObj).countDocuments();
    res.status(200).json({
      success: response ? true : false,
      blogs: response ? response : "Đã xảy ra lỗi",
      counts,
    });
  });
});

const getBlogCategorys = asyncHandler(async (req, res) => {
  const response = await BlogCategory.find();
  res.status(200).json({
    success: response ? true : false,
    blogCategoryData: response ? response : "Đã xảy ra lỗi",
  });
});

const getBlogCategory = asyncHandler(async (req, res) => {
  const { bcid } = req.params;
  const response = await BlogCategory.findById(bcid);
  res.status(200).json({
    success: response ? true : false,
    blogCategoryData: response ? response : "Đã xảy ra lỗi",
  });
});

const updateBlogCategory = asyncHandler(async (req, res) => {
  console.log(req.body);
  const { bcid } = req.params;
  const response = await BlogCategory.findByIdAndUpdate(bcid, req.body, {
    new: true,
  });
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Cập nhật thành công" : "Đã xảy ra lỗi",
  });
});

const deleteBlogCategory = asyncHandler(async (req, res) => {
  const { bcid } = req.params;
  const response = await BlogCategory.findByIdAndDelete(bcid);
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Xóa thành công" : "Đã xảy ra lỗi",
  });
});

module.exports = {
  createBlogCategory,
  getBlogCategories,
  getBlogCategorys,
  getBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
};
