const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },
    thumb: {
      type: String,
      require: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    status: {
      type: String,
      default: "Còn hàng",
      enum: ["Còn hàng", "Hết hàng"],
    },
    sold: {
      type: Number,
      default: 0,
    },
    images: {
      type: Array,
    },
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color",
    },
    ratings: [
      {
        star: { type: Number },
        comment: { type: String },
        postedby: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        updatedAt: {
          type: Date,
        },
      },
    ],
    totalratings: {
      type: Number,
      default: 0,
    },
    variants: [
      {
        color: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Color",
        },
        price: Number,
        discount: Number,
        thumb: String,
        images: Array,
        title: String,
        sku: String,
      },
    ],
    tags: {
      type: [String],
    },
  },
  {
    timestamps: true,
  }
);

//Export the model
module.exports = mongoose.model("Product", productSchema);
