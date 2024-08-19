const Config = require("../models/config");
const asyncHandler = require("express-async-handler");

const createConfig = asyncHandler(async (req, res) => {
  console.log(req.body);
  const response = await Config.create(req.body);
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Tạo thành công" : "Đã xảy ra lỗi",
  });
});

const updateConfig = asyncHandler(async (req, res) => {
  const { cid } = req.params;
  const files = req?.files;
  if (files?.logo) {
    req.body.logo = files?.logo[0]?.path;
  }
  if (files?.favicon) {
    req.body.favicon = files?.favicon[0]?.path;
  }

  const response = await Config.findByIdAndUpdate(cid, req.body, {
    new: true,
  });
  res.status(200).json({
    success: response ? true : false,
    message: response ? "Cập nhật thành công" : "Đã xảy ra lỗi",
  });
});

const getConfig = asyncHandler(async (req, res) => {
  const { cid } = req.params;
  const response = await Config.findById(cid);
  res.status(200).json({
    success: response ? true : false,
    configs: response ? response : "Đã xảy ra lỗi",
  });
});

module.exports = {
  createConfig,
  updateConfig,
  getConfig,
};
