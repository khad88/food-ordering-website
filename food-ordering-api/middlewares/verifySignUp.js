const db = require("../models");
const User = db.users;
const Staff = db.staffs;

// Middleware kiểm tra email trùng lặp
checkDuplicateEmail = async (req, res, next) => {
  try {
    // Kiểm tra email cho user
    let user = await User.findOne({
      where: {
        email: req.body.email
      }
    });

    if (user) {
      return res.status(400).send({
        message: "Email đã tồn tại!"
      });
    }

    // Kiểm tra email cho staff
    let staff = await Staff.findOne({
      where: {
        email: req.body.email
      }
    });

    if (staff) {
      return res.status(400).send({
        message: "Email đã tồn tại trong hệ thống nhân viên!"
      });
    }

    next();
  } catch (error) {
    return res.status(500).send({
      message: error.message
    });
  }
};

// Middleware kiểm tra dữ liệu đăng ký
validateSignupData = (req, res, next) => {
  const { name, email, password, phone, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).send({
      message: "Tên, email và mật khẩu là bắt buộc!"
    });
  }

  if (password.length < 6) {
    return res.status(400).send({
      message: "Mật khẩu phải có ít nhất 6 ký tự!"
    });
  }

  if (phone && !/^\d{10,15}$/.test(phone)) {
    return res.status(400).send({
      message: "Số điện thoại không hợp lệ!"
    });
  }

  next();
};

// Xuất các middleware
const verifySignUp = {
  checkDuplicateEmail: checkDuplicateEmail,
  validateSignupData: validateSignupData, // Thêm validateSignupData
};

module.exports = verifySignUp;