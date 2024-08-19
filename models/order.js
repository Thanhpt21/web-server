const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var orderSchema = new mongoose.Schema(
  {
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: Number,
        color: { type: mongoose.Schema.Types.ObjectId, ref: "Color" },
        price: Number,
        discount: Number,
        thumb: String,
        title: String,
      },
    ],
    status: {
      type: String,
      default: "Đang chờ duyệt",
      enum: ["Đã hủy", "Thành công", "Đang chờ duyệt", "Đang giao hàng"],
    },
    address: {
      type: String,
      require: true,
    },
    total: Number,
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
    ship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ship",
      default: null,
    },
    methodPayment: {
      type: String,
      required: true,
    },
    deliveryMethod: {
      type: String,
      enum: ["Ship theo tỉnh thành", "Ship siêu tốc"],
      default: "Ship theo tỉnh thành",
    },
    orderBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },

  {
    timestamps: true,
  }
);

//Export the model
module.exports = mongoose.model("Order", orderSchema);
