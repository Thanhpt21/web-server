const Menu = require("../models/menu");
const asyncHandler = require("express-async-handler");
const Category = require("../models/category"); // Import mô hình Category

const getMenus = asyncHandler(async (req, res) => {
  try {
    // Lấy tất cả các menu từ cơ sở dữ liệu
    const menus = await Menu.find({});

    // Trả về phản hồi
    res.status(200).json({
      success: true,
      data: menus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi lấy danh sách menu.",
      error: error.message,
    });
  }
});
const createMenu = asyncHandler(async (req, res) => {
  const { value, path, type, parent, orderly } = req.body;

  // Kiểm tra yêu cầu bắt buộc
  if (!value || !path) {
    return res.status(400).json({
      success: false,
      message: "Tên và đường dẫn không được để trống",
    });
  }

  // Kiểm tra loại menu
  if (!["PARENT", "SINGLE"].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Loại menu không hợp lệ",
    });
  }

  let response;

  try {
    if (type === "PARENT") {
      // Tạo menu cha
      response = await Menu.create({ value, path, type, parent, orderly });

      // Nếu có parent, cập nhật submenu của menu cha
      if (parent && parent.length > 0) {
        for (const parentId of parent) {
          const parentMenu = await Menu.findById(parentId);

          if (!parentMenu) {
            return res.status(404).json({
              success: false,
              message: `Không tìm thấy menu cha với ID ${parentId}`,
            });
          }

          // Thêm menu con vào submenu của menu cha
          parentMenu.submenu.push({
            value,
            path,
            type: "PARENT", // Đảm bảo type là "PARENT" cho menu con trong submenu
            parent: parentMenu._id, // ID của menu cha
            _id: response._id,
            orderly,
          });

          await parentMenu.save();
        }
      }
    } else if (type === "SINGLE") {
      // Tạo menu đơn, parent có thể là mảng rỗng hoặc không được truyền lên
      response = await Menu.create({ value, path, type, parent: [], orderly });
    }

    res.status(200).json({
      success: true,
      message: "Tạo thành công",
      data: response,
    });
  } catch (error) {
    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyPattern.value === 1
    ) {
      console.log(`Menu '${value}' đã tồn tại.`);
      return res.status(200).json({
        success: false,
        message: `Menu '${value}' đã tồn tại.`,
      });
    }

    console.error("Error creating menu:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi tạo menu",
    });
  }
});
// Hàm cập nhật menu
const updateMenu = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { value, path, type, parent, orderly } = req.body;

  // Kiểm tra yêu cầu bắt buộc
  if (!value || !path || !type) {
    return res.status(400).json({
      success: false,
      message: "Tên, đường dẫn và loại menu không được để trống",
    });
  }

  // Kiểm tra loại menu
  if (!["PARENT", "SINGLE"].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Loại menu không hợp lệ",
    });
  }

  let existingMenu;

  try {
    existingMenu = await Menu.findById(id);

    if (!existingMenu) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy menu với ID ${id}`,
      });
    }

    // Cập nhật thông tin menu
    existingMenu.value = value;
    existingMenu.path = path;
    existingMenu.type = type;
    existingMenu.parent = parent || [];
    existingMenu.orderly = orderly;

    // Nếu là menu cha (type === "SINGLE")
    if (type === "SINGLE") {
      // Xóa parent và submenu của menu cha
      existingMenu.parent = [];
      existingMenu.submenu = [];
    } else if (type === "PARENT") {
      // Nếu là menu con (type === "PARENT")

      // Cập nhật submenu của các menu cha
      // Lấy danh sách các menu cha của menu con
      const parentMenus = await Menu.find({ "submenu._id": existingMenu._id });

      for (const parentMenu of parentMenus) {
        const submenuIndex = parentMenu.submenu.findIndex(
          (submenu) => submenu._id.toString() === existingMenu._id.toString()
        );

        if (submenuIndex !== -1) {
          // Cập nhật thông tin submenu của menu cha
          parentMenu.submenu[submenuIndex].value = value;
          parentMenu.submenu[submenuIndex].path = path;
          parentMenu.submenu[submenuIndex].orderly = orderly;

          await parentMenu.save();
        }
      }
    }

    // Lưu lại menu đã cập nhật
    await existingMenu.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật thành công",
      data: existingMenu,
    });
  } catch (error) {
    console.error("Error updating menu:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật menu",
    });
  }
});

const deleteMenu = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let menuToDelete;

  try {
    menuToDelete = await Menu.findById(id);

    if (!menuToDelete) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy menu với ID ${id}`,
      });
    }

    // Nếu là menu con (type === "PARENT")
    if (menuToDelete.type === "PARENT") {
      // Xóa menu con khỏi database
      await Menu.findByIdAndDelete(id);

      // Cập nhật lại submenu của các menu cha (parent) chứa menuToDelete
      if (menuToDelete.parent && menuToDelete.parent.length > 0) {
        for (const parentId of menuToDelete.parent) {
          const parentMenu = await Menu.findById(parentId);

          if (parentMenu) {
            parentMenu.submenu = parentMenu.submenu.filter(
              (submenu) => submenu._id.toString() !== id
            );

            await parentMenu.save();
          }
        }
      }
    } else if (menuToDelete.type === "SINGLE") {
      // Nếu là menu cha (type === "SINGLE")
      // Xóa ra khỏi các submenu của menu con mà không ảnh hưởng đến menu con
      const submenuIds = menuToDelete.submenu.map((submenu) =>
        submenu._id.toString()
      );

      // Xóa menu cha khỏi database
      await Menu.findByIdAndDelete(id);

      // Cập nhật lại menu cha trong các menu con (submenu)
      for (const submenuId of submenuIds) {
        const submenu = await Menu.findById(submenuId);

        if (submenu) {
          submenu.parent = submenu.parent.filter(
            (parentId) => parentId.toString() !== id
          );
          await submenu.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Xóa menu thành công",
    });
  } catch (error) {
    console.error("Error deleting menu:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xóa menu",
    });
  }
});

module.exports = {
  createMenu,
  updateMenu,
  deleteMenu,
  getMenus,
};
