const mongoose = require("mongoose");

const retailSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    mobile: { type: String, required: true },
    link: { type: String, required: true },
    iframe: { type: String, require: true },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Retail", retailSchema);
