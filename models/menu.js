const mongoose = require("mongoose");

// Định nghĩa schema cho Menu
const menuSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      required: true,
      unique: false,
    },
    path: {
      type: String,
      required: true,
      unique: false,
    },
    type: {
      type: String,
      enum: ["PARENT", "SINGLE"],
      default: "SINGLE", // Giá trị mặc định là SINGLE nếu không được cung cấp
    },
    parent: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Menu",
      },
    ],
    orderly: {
      type: Number,
      default: 1, // Giá trị mặc định của orderly
    },
    submenu: [
      {
        value: {
          type: String,
          required: true,
        },
        path: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["PARENT", "SINGLE"],
          default: "PARENT", // Giá trị mặc định là SINGLE nếu không được cung cấp
        },
        parent: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Menu",
          },
        ],
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Menu",
        },
        orderly: {
          type: Number,
          default: 1, // Giá trị mặc định của orderly
        },
      },
    ],
  },

  { timestamps: true }
);

const Menu = mongoose.model("Menu", menuSchema);

module.exports = Menu;
