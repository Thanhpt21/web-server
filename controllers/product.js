const Product = require("../models/product");
const Category = require("../models/category");
const Brand = require("../models/brand");
const Color = require("../models/color");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const makeSKU = require("uniqid");
const mongoose = require("mongoose");

const createProduct = asyncHandler(async (req, res) => {
  const {
    title,
    price,
    discount,
    description,
    brand,
    color,
    category,
    code,
    tags,
  } = req.body;
  const thumb = req?.files?.thumb[0]?.path;
  const images = req?.files?.images?.map((el) => el.path);
  if (!(title && price && discount && description && brand && color && code)) {
    throw new Error("Missing input");
  }
  req.body.slug = slugify(req.body.title);

  if (thumb) req.body.thumb = thumb;
  if (images) req.body.images = images;

  if (tags) {
    req.body.tags = tags.split(",").map((tag) => tag.trim());
  }
  const cat = await Category.findById(category);
  if (!cat) {
    return res.status(404).json({ message: "Category not found" });
  }

  const col = await Color.findById(color);
  if (!col) {
    return res.status(404).json({ message: "Color not found" });
  }

  const bra = await Brand.findById(brand);
  if (!bra) {
    return res.status(404).json({ message: "Brand not found" });
  }

  const response = await Product.create({ ...req.body, cat, col, bra });
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Tạo sản phẩm thành công" : "Đã xảy ra lỗi",
  });
});

const getProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const response = await Product.findById(pid)
    .populate("category", "title images")
    .populate("color", "title code")
    .populate("brand", "title images")
    .populate({
      path: "ratings",
      populate: {
        path: "postedby",
        select: "firstname lastname avatar",
      },
    })
    .populate({
      path: "variants",
      populate: {
        path: "color", // Populate the color in variants
        select: "title",
      },
    });
  res.status(200).json({
    success: response ? true : false,
    productData: response ? response : "Đã xảy ra lỗi",
  });
});

const getProducts = asyncHandler(async (req, res) => {
  const queryObj = { ...req.query };
  const excludeFields = ["page", "sort", "limit", "fields"];
  excludeFields.forEach((el) => delete queryObj[el]);
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  let formatedQueryObj = JSON.parse(queryStr);

  let formatQueries = {};

  if (queryObj?.title)
    formatedQueryObj.title = { $regex: queryObj.title, $options: "i" };

  if (req.query.q) {
    delete formatedQueryObj.q;
    formatedQueryObj["$or"] = [
      { title: { $regex: req.query.q, $options: "i" } },
    ];
  }

  if (queryObj?.category) {
    if (mongoose.isValidObjectId(queryObj.category)) {
      // Nếu category là ID hợp lệ, sử dụng ObjectId
      formatedQueryObj.category = mongoose.Types.ObjectId(queryObj.category);
    } else {
      formatedQueryObj.category = { $regex: queryObj.category };
    }
  }
  if (queryObj?.color) {
    // Chia các ID màu ra và chuyển chúng thành ObjectId
    const colorIds = queryObj.color
      .split(",")
      .map((id) => id.trim()) // Xóa khoảng trắng thừa
      .filter((id) => mongoose.isValidObjectId(id)) // Chỉ giữ lại các ID hợp lệ
      .map((id) => mongoose.Types.ObjectId(id)); // Chuyển đổi thành ObjectId

    if (colorIds.length > 0) {
      formatedQueryObj.color = { $in: colorIds };
    } else {
      // Nếu không có ID hợp lệ, có thể xử lý tùy theo yêu cầu (nếu cần)
      delete formatedQueryObj.color; // Xóa nếu không có ID hợp lệ
    }
  }

  if (queryObj?.brand) {
    // Chia các ID màu ra và chuyển chúng thành ObjectId
    const brandIds = queryObj.brand
      .split(",")
      .map((id) => id.trim()) // Xóa khoảng trắng thừa
      .filter((id) => mongoose.isValidObjectId(id)) // Chỉ giữ lại các ID hợp lệ
      .map((id) => mongoose.Types.ObjectId(id)); // Chuyển đổi thành ObjectId

    if (brandIds.length > 0) {
      formatedQueryObj.brand = { $in: brandIds };
    } else {
      // Nếu không có ID hợp lệ, có thể xử lý tùy theo yêu cầu (nếu cần)
      delete formatedQueryObj.brand; // Xóa nếu không có ID hợp lệ
    }
  }

  if (queryObj?.q) {
    delete formatedQueryObj.q;
    formatedQueryObj["$or"] = [
      { title: { $regex: queryObj.q, $options: "i" } },
      // { color: { $regex: queryObj.q, $options: "i" } },
    ];
  }

  const sanitizeQuery = (query) => {
    const sanitized = { ...query };
    for (const key in sanitized) {
      if (
        sanitized[key] &&
        typeof sanitized[key] === "object" &&
        sanitized[key].$options
      ) {
        sanitized[key] = {
          $regex: sanitized[key].$regex,
          $options: sanitized[key].$options,
        };
      }
    }
    return sanitized;
  };

  let sanitizedQueryObj = sanitizeQuery(formatedQueryObj);

  let q = { ...formatQueries, ...sanitizedQueryObj };
  let query = Product.find(q)
    .populate("color", "title code")
    .populate("category", "title images")
    .populate("brand", "title images")
    .populate({
      path: "variants",
      populate: {
        path: "color", // Populate the color in variants
        select: "title",
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
  const limit = +req.query.limit || 10;
  const skip = (page - 1) * limit;
  query = query.skip(skip).limit(limit);
  query.exec(async (err, response) => {
    if (err) throw new Error(err.message);
    const counts = await Product.find(q).countDocuments();
    res.status(200).json({
      success: response ? true : false,
      products: response ? response : "Đã xảy ra lỗi",
      counts,
    });
  });
});

const getAllProducts = asyncHandler(async (req, res) => {
  const response = await Product.find()
    .populate("color", "title code")
    .populate("category", "title images")
    .populate("brand", "title images")
    .populate({
      path: "variants",
      populate: {
        path: "color", // Populate the color in variants
        select: "title",
      },
    });
  res.status(200).json({
    success: response ? true : false,
    products: response ? response : "Đã xảy ra lỗi",
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const files = req?.files;

  if (files?.thumb) {
    req.body.thumb = files?.thumb[0]?.path;
  }
  if (files?.images) {
    req.body.images = files?.images?.map((el) => el.path);
  }

  if (req.body.tags) {
    req.body.tags = req.body.tags.split(",").map((tag) => tag.trim());
  }

  if (req.body && req.body.title) {
    req.body.slug = slugify(req.body.title);
  }
  const response = await Product.findByIdAndUpdate(pid, req.body, {
    new: true,
  });
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Cập nhật thành công" : "Đã xảy ra lỗi",
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const response = await Product.findByIdAndDelete(pid);
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Xóa thành công" : "Đã xảy ra lỗi",
  });
});

const ratings = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { pid, star, comment, updatedAt } = req.body;
  if (!star || !pid) throw new Error("Missing input");
  const product = await Product.findById(pid);
  const alreadyRated = product?.ratings?.some(
    (el) => el.postedby.toString() === _id
  );

  if (alreadyRated) {
    await Product.updateOne(
      {
        ratings: { $elemMatch: { alreadyRated } },
      },
      {
        $set: {
          "ratings.$.star": star,
          "ratings.$.comment": comment,
          "ratings.$.updatedAt": updatedAt,
        },
      },
      {
        new: true,
      }
    );
  } else {
    await Product.findByIdAndUpdate(
      pid,
      {
        $push: { ratings: { star, comment, postedby: _id, updatedAt } },
      },
      { new: true }
    );
  }
  const updatedProduct = await Product.findById(pid);
  let totalRatings = updatedProduct.ratings.length;
  let ratingsum = updatedProduct.ratings.reduce((sum, el) => sum + el.star, 0);
  updatedProduct.totalratings =
    Math.round((ratingsum * 10) / totalRatings) / 10;

  await updatedProduct.save();

  return res.status(200).json({
    status: true,
    updatedProduct,
  });
});

const uploadImageProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  if (!req.files) throw new "Missing input"();
  const response = await Product.findByIdAndUpdate(
    pid,
    {
      $push: { images: { $each: req.files.map((el) => el.path) } },
    },
    { new: true }
  );
  return res.status(200).json({
    success: response ? true : false,
    updatedProduct: response ? response : "Đã xảy ra lỗi",
  });
});

const addVariant = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const { title, price, color, discount } = req.body;
  const thumb = req?.files?.thumb[0]?.path;
  const images = req?.files?.images?.map((el) => el.path);

  if (!(title && price && color && discount)) {
    throw new Error("Missing input");
  }
  const col = await Color.findById(color);
  if (!col) {
    return res.status(404).json({ message: "Color not found" });
  }

  req.body.slug = slugify(req.body.title);

  const response = await Product.findByIdAndUpdate(
    pid,
    {
      $push: {
        variants: {
          color,
          price,
          discount,
          title,
          thumb,
          images,
          sku: makeSKU().toUpperCase(),
        },
      },
    },
    { new: true }
  );
  return res.status(200).json({
    success: response ? true : false,
    response: response ? "Thêm thành công" : "Đã xảy ra lỗi",
  });
});

const updateVariant = asyncHandler(async (req, res) => {
  const { pid, sku } = req.params;
  const { title, price, color, discount, thumb, images } = req.body;

  if (thumb) {
    req.body.thumb = thumb;
  }
  if (images) {
    req.body.images = images.map((el) => el);
  }

  // Kiểm tra các trường bắt buộc
  if (!(title && price && color && discount)) {
    return res.status(400).json({ message: "Missing input" });
  }

  // Kiểm tra sự tồn tại của màu sắc
  const col = await Color.findById(color);
  if (!col) {
    return res.status(404).json({ message: "Color not found" });
  }

  // Tạo slug từ tiêu đề
  req.body.slug = slugify(req.body.title);

  // Cập nhật sản phẩm
  const response = await Product.findOneAndUpdate(
    { _id: pid, "variants.sku": sku },
    {
      $set: {
        "variants.$.title": title,
        "variants.$.price": price,
        "variants.$.discount": discount,
        "variants.$.color": color,
        "variants.$.thumb": thumb,
        "variants.$.images": images,
        "variants.$.sku": makeSKU().toUpperCase(),
      },
    },
    { new: true }
  );
  return res.status(200).json({
    success: response ? true : false,
    message: response ? "Cập nhật thành công" : "Đã xảy ra lỗi",
  });
});

const removeVariant = asyncHandler(async (req, res) => {
  const { pid, sku } = req.params;
  const response = await Product.findByIdAndUpdate(
    pid,
    {
      $pull: {
        variants: {
          sku: sku,
        },
      },
    },
    { new: true }
  );
  return res.status(200).json({
    success: response ? true : false,
    response: response ? "Xóa thành công" : "Đã xảy ra lỗi",
  });
});

module.exports = {
  createProduct,
  getProduct,
  getProducts,
  getAllProducts,
  updateProduct,
  deleteProduct,
  ratings,
  uploadImageProduct,
  addVariant,
  updateVariant,
  removeVariant,
};
