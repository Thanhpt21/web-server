const Blog = require("../models/blog");
const BlogCategory = require("../models/blogcategory");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

const createBlog = asyncHandler(async (req, res) => {
  console.log(req.body);
  const { title, description, category } = req.body;
  const images = req?.file?.path;

  if (!title || !description || !category) {
    throw new Error("Missing input");
  }

  if (images) req.body.images = images;

  // Tìm và kiểm tra danh mục của blog
  let cat = await BlogCategory.findById(category);
  if (!cat) {
    return res.status(404).json({ message: "BlogCategory not found" });
  }

  // Xử lý dữ liệu content
  let contentArray = [];
  if (req.body.content && Array.isArray(req.body.content)) {
    contentArray = req.body.content.map((item) => ({
      title: item.title,
      body: item.body,
    }));
  }

  const response = await Blog.create({ ...req.body, content: contentArray });

  res.status(200).json({
    success: response ? true : false,
    message: response ? "Bài đăng đã được tạo thành công" : "Đã xảy ra lỗi",
  });
});
const updateBlog = asyncHandler(async (req, res) => {
  const { bid } = req.params; // Lấy id của blog cần cập nhật từ URL params
  const { title, description, category, content } = req.body; // Lấy dữ liệu mới từ body request
  const images = req?.file?.path; // Lấy đường dẫn hình ảnh nếu có

  // Kiểm tra các trường thông tin bắt buộc
  if (!title || !description || !category) {
    return res.status(400).json({ success: false, message: "Missing input" });
  }

  // Tìm và kiểm tra danh mục của blog
  let cat = await BlogCategory.findById(category);
  if (!cat) {
    return res
      .status(404)
      .json({ success: false, message: "BlogCategory not found" });
  }

  // Xử lý nội dung content từ formData
  let updatedContent = [];
  if (content && Array.isArray(content)) {
    updatedContent = content.map((item) => ({
      title: item.title,
      body: item.body,
    }));
  }

  // Tạo object mới để cập nhật vào cơ sở dữ liệu
  const updateFields = {
    title,
    description,
    category: cat,
    content: updatedContent,
  };

  // Nếu có hình ảnh, thêm vào updateFields
  if (images) {
    updateFields.images = images;
  }

  // Thực hiện cập nhật bài đăng trong cơ sở dữ liệu
  const response = await Blog.findByIdAndUpdate(bid, updateFields, {
    new: true,
  });

  // Trả về kết quả
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Cập nhật thành công" : "Đã xảy ra lỗi",
  });
});
const getBlogs = asyncHandler(async (req, res) => {
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

  // Kiểm tra và xử lý category
  if (
    formatedQueryObj.category &&
    !mongoose.Types.ObjectId.isValid(formatedQueryObj.category)
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Category is not valid ObjectId" });
  }

  let query = Blog.find(formatedQueryObj).populate("category", "title");

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
  const limit = +req.query.limit || 8;
  const skip = (page - 1) * limit;
  query = query.skip(skip).limit(limit);
  query.exec(async (err, response) => {
    if (err) throw new Error(err.message);
    const counts = await Blog.find(formatedQueryObj).countDocuments();
    res.status(200).json({
      success: response ? true : false,
      blogs: response ? response : "Đã xảy ra lỗi",
      counts,
    });
  });
});

const getAllBlogs = asyncHandler(async (req, res) => {
  const response = await Blog.find();
  res.status(200).json({
    success: response ? true : false,
    blogs: response ? response : "Đã xảy ra lỗi",
  });
});

const getBlog = asyncHandler(async (req, res) => {
  const { bid } = req.params;
  const { _id } = req.user;
  // console.log("req.user", req.user);
  const blog = await Blog.findById(bid);

  if (!blog) {
    return res
      .status(404)
      .json({ success: false, message: "Bài viết không tồn tại" });
  }

  //Kiểm tra xem người dùng đã xem bài viết chưa
  if (!blog.viewedBy.includes(_id)) {
    // Nếu chưa xem, tăng số lượt xem và thêm ID người dùng vào danh sách đã xem
    blog.numberViews += 1;
    blog.viewedBy.push(_id);
    await blog.save();
  }

  const response = await Blog.findById(bid)
    .populate("likes", "firstname lastname")
    .populate("dislikes", "firstname lastname");
  res.status(200).json({
    success: response ? true : false,
    blogs: response ? response : "Đã xảy ra lỗi",
  });
});

const deleteBlog = asyncHandler(async (req, res) => {
  const { bid } = req.params;
  const response = await Blog.findByIdAndDelete(bid);
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Xóa thành công" : "Đã xảy ra lỗi",
  });
});

const likeBlog = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { bid } = req.params;
  console.log("bid", bid);
  if (!bid) throw new Error("Missing input");

  const blog = await Blog.findById(bid);
  if (!blog) {
    return res.status(404).json({ success: false, message: "Blog not found" });
  }

  const alreadyDisliked = blog.dislikes.includes(_id);
  const isLiked = blog.likes.includes(_id);

  // If the user has already disliked the blog, remove the dislike
  if (alreadyDisliked) {
    await Blog.findByIdAndUpdate(
      bid,
      { $pull: { dislikes: _id } },
      { new: true }
    );
  }

  let response;
  if (isLiked) {
    // If the blog is already liked by the user, remove the like
    response = await Blog.findByIdAndUpdate(
      bid,
      { $pull: { likes: _id } },
      { new: true }
    );
  } else {
    // Otherwise, add the like
    response = await Blog.findByIdAndUpdate(
      bid,
      { $push: { likes: _id } },
      { new: true }
    );
  }

  return res.json({
    success: response ? true : false,
    response,
  });
});

const dislikeBlog = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { bid } = req.params;

  if (!bid) throw new Error("Missing input");

  const blog = await Blog.findById(bid);
  if (!blog) {
    return res.status(404).json({ success: false, message: "Blog not found" });
  }

  const alreadyLiked = blog.likes.includes(_id);
  const isDisliked = blog.dislikes.includes(_id);

  // If the user has already liked the blog, remove the like
  if (alreadyLiked) {
    await Blog.findByIdAndUpdate(bid, { $pull: { likes: _id } }, { new: true });
  }

  let response;
  if (isDisliked) {
    // If the blog is already disliked by the user, remove the dislike
    response = await Blog.findByIdAndUpdate(
      bid,
      { $pull: { dislikes: _id } },
      { new: true }
    );
  } else {
    // Otherwise, add the dislike
    response = await Blog.findByIdAndUpdate(
      bid,
      { $push: { dislikes: _id } },
      { new: true }
    );
  }

  return res.json({
    success: response ? true : false,
    response,
  });
});

const uploadImageBlog = asyncHandler(async (req, res) => {
  const { bid } = req.params;
  if (!req.file) throw new "Missing input"();
  const response = await Blog.findByIdAndUpdate(
    bid,
    {
      $push: { images: req.file.path },
    },
    { new: true }
  );
  return res.status(200).json({
    success: response ? true : false,
    updatedBlog: response ? response : "Đã xảy ra lỗi",
  });
});

module.exports = {
  createBlog,
  getBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
  likeBlog,
  dislikeBlog,
  uploadImageBlog,
  getAllBlogs,
};
