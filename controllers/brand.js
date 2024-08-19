const Brand = require("../models/brand");
const Category = require("../models/category");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

const createBrand = asyncHandler(async (req, res) => {
  const { title, category } = req.body;
  const images = req?.file?.path;
  if (images) req.body.images = images;
  if (!title) {
    return res
      .status(400)
      .json({ success: false, message: "Title is required" });
  }
  if (category) {
    if (!mongoose.isValidObjectId(category)) {
      res.status(400).json({ success: false, message: "Invalid category ID" });
      return;
    }

    // Kiểm tra xem category ID có thực sự tồn tại trong cơ sở dữ liệu không
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      res.status(404).json({ success: false, message: "Category not found" });
      return;
    }
  }

  const response = await Brand.create(req.body);

  if (category) {
    await Category.findByIdAndUpdate(
      category,
      { $addToSet: { brands: response._id } },
      { new: true } // Trả về đối tượng đã cập nhật
    );
  }

  res.status(200).json({
    success: response ? true : false,
    message: response ? "Tạo thành công" : "Đã xảy ra lỗi",
  });
});

const getBrands = asyncHandler(async (req, res) => {
  const queryObj = { ...req.query };
  const excludeFields = ["page", "sort", "limit", "fields"];
  excludeFields.forEach((el) => delete queryObj[el]);
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  let formatedQueryObj = JSON.parse(queryStr);

  if (queryObj?.title)
    formatedQueryObj.title = { $regex: queryObj.title, $options: "i" };

  if (queryObj?.category) {
    if (mongoose.isValidObjectId(queryObj.category)) {
      // Nếu category là ID hợp lệ, sử dụng ObjectId
      formatedQueryObj.category = mongoose.Types.ObjectId(queryObj.category);
    } else {
      formatedQueryObj.category = { $regex: queryObj.category };
    }
  }

  if (req.query.q) {
    delete formatedQueryObj.q;
    formatedQueryObj["$or"] = [
      { title: { $regex: req.query.q, $options: "i" } },
    ];
  }

  let query = Brand.find(formatedQueryObj).populate("category", "title");

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
    const counts = await Brand.find(formatedQueryObj).countDocuments();
    res.status(200).json({
      success: response ? true : false,
      brands: response ? response : "Đã xảy ra lỗi",
      counts,
    });
  });
});

const getBrand = asyncHandler(async (req, res) => {
  const { bid } = req.params;
  const response = await Brand.findById(bid);
  res.status(200).json({
    success: response ? true : false,
    brandData: response ? response : "Đã xảy ra lỗi",
  });
});

const updateBrand = asyncHandler(async (req, res) => {
  const { bid } = req.params;
  const { title, category } = req.body;
  if (req.file) {
    req.body.images = req.file.path;
  }
  if (!title && !category) {
    return res
      .status(400)
      .json({ success: false, message: "No update data is required" });
  }
  // Tìm Brand hiện tại
  const brand = await Brand.findById(bid);
  if (!brand) {
    return res.status(404).json({ success: false, message: "Brand not found" });
  }

  // Cập nhật Category cũ nếu có
  if (brand.category && brand.category.toString() !== category) {
    await Category.findByIdAndUpdate(
      brand.category,
      { $pull: { brands: bid } }, // Xóa ID của Brand khỏi mảng brands
      { new: true }
    );
  }
  // Cập nhật Brand
  const response = await Brand.findByIdAndUpdate(bid, req.body, {
    new: true,
  });
  // Cập nhật Category mới nếu có
  if (category) {
    await Category.findByIdAndUpdate(
      category,
      { $addToSet: { brands: bid } }, // Thêm ID của Brand vào mảng brands
      { new: true }
    );
  }

  res.status(200).json({
    success: response ? true : false,
    message: response ? "Cập nhật thành công" : "Đã xảy ra lỗi",
  });
});

const deleteBrand = asyncHandler(async (req, res) => {
  const { bid } = req.params;
  const response = await Brand.findByIdAndDelete(bid);
  res.status(200).json({
    success: response ? true : false,
    deletedBrand: response ? response : "Đã xảy ra lỗi",
  });
});

module.exports = {
  createBrand,
  getBrands,
  getBrand,
  updateBrand,
  deleteBrand,
};
