const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var configSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  mobile: {
    type: String,
  },
  address: {
    type: String,
  },
  googlemap: {
    type: String,
  },
  facebook: {
    type: String,
  },
  zalo: {
    type: String,
  },
  instagram: {
    type: String,
  },
  tiktok: {
    type: String,
  },
  logo: {
    type: String,
  },
  favicon: {
    type: String,
  },
});

//Export the model
module.exports = mongoose.model("Config", configSchema);
