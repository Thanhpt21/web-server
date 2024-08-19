const userRouter = require("./user");
const productRouter = require("./product");
const categoryRouter = require("./category");
const bcategoryRouter = require("./blogcategory");
const blogRouter = require("./blog");
const brandRouter = require("./brand");
const couponRouter = require("./coupon");
const orderRouter = require("./order");
const colorRouter = require("./color");
const enquiryRouter = require("./enquiry");
const configRouter = require("./config");
const menuRouter = require("./menu");
const shipRouter = require("./ship");
const retailRouter = require("./retail");

const { notFound, errorHandler } = require("../middlewares/errorHandle");

const initRouter = (app) => {
  app.use("/api/user", userRouter);
  app.use("/api/product", productRouter);
  app.use("/api/category", categoryRouter);
  app.use("/api/blogcategory", bcategoryRouter);
  app.use("/api/blog", blogRouter);
  app.use("/api/brand", brandRouter);
  app.use("/api/coupon", couponRouter);
  app.use("/api/order", orderRouter);
  app.use("/api/color", colorRouter);
  app.use("/api/enquiry", enquiryRouter);
  app.use("/api/config", configRouter);
  app.use("/api/menu", menuRouter);
  app.use("/api/ship", shipRouter);
  app.use("/api/retail", retailRouter);
  app.use(notFound);
  app.use(errorHandler);
};

module.exports = initRouter;
