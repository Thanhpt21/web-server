const Enquiry = require("../models/enquiry");
const asyncHandler = require("express-async-handler");

const createEnquiry = asyncHandler(async (req, res) => {
  const { name, email, mobile } = req.body;
  if (!name && !email && !mobile) throw new Error("Missing input");
  const response = await Enquiry.create(req.body);
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Gửi thành công" : "Đã xảy ra lỗi",
  });
});

const getEnquirys = asyncHandler(async (req, res) => {
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

  let query = Enquiry.find(formatedQueryObj);

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
    const counts = await Enquiry.find(formatedQueryObj).countDocuments();
    res.status(200).json({
      success: response ? true : false,
      enquiry: response ? response : "Đã xảy ra lỗi",
      counts,
    });
  });
});

const getEnquiry = asyncHandler(async (req, res) => {
  const { eid } = req.params;
  const response = await Enquiry.findById(eid);
  res.status(200).json({
    success: response ? true : false,
    enquiry: response ? response : "Đã xảy ra lỗi",
  });
});

const updateEnquiry = asyncHandler(async (req, res) => {
  const { eid } = req.params;
  const response = await Enquiry.findByIdAndUpdate(eid, req.body, {
    new: true,
  });
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Cập nhật thành công" : "Đã xảy ra lỗi",
  });
});

const deleteEnquiry = asyncHandler(async (req, res) => {
  const { eid } = req.params;
  const response = await Enquiry.findByIdAndDelete(eid);
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Xóa thành công" : "Đã xảy ra lỗi",
  });
});

module.exports = {
  createEnquiry,
  getEnquirys,
  getEnquiry,
  updateEnquiry,
  deleteEnquiry,
};
