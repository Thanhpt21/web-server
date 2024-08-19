const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var shipSchema = new mongoose.Schema(
  {
    province: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

//Export the model
module.exports = mongoose.model("Ship", shipSchema);
