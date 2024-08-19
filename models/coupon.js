const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var couponSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  expiry: {
    type: Date,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  minPrice: {
    type: Number,
    required: true,
  },
  usageLimit: {
    type: Number,
    required: true,
    min: [0, "Usage limit must be a positive number"],
  },
  usedCount: {
    type: Number,
    default: 0,
    min: [0, "Used count must be a non-negative number"],
  },
});

//Export the model
module.exports = mongoose.model("Coupon", couponSchema);
