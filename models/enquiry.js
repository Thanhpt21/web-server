const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var enqSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: false,
    },
    mobile: {
      type: String,
      required: true,
      unique: false,
    },
    comment: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "Đang chờ",
      enum: ["Đã hủy", "Đang chờ", "Đã liên lạc"],
    },
  },
  {
    timestamps: true,
  }
);

//Export the model
module.exports = mongoose.model("Enquiry", enqSchema);
