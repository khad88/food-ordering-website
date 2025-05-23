// controllers/auth.controller.js
const db = require("../models");
const config = require("../config/auth.config");
const User = db.users;
const Staff = db.staffs;
const Cart = db.carts;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  try {
    // Tạo tài khoản người dùng
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      phone: req.body.phone,
      address: req.body.address
    });

    // Tạo giỏ hàng cho người dùng
    await Cart.create({
      user_id: user.user_id
    });

    res.status(200).send({ message: "Đăng ký thành công!" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.signin = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        email: req.body.email
      }
    });

    if (!user) {
      return res.status(404).send({ message: "Không tìm thấy người dùng." });
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Mật khẩu không đúng!"
      });
    }

    const token = jwt.sign({ id: user.user_id, type: 'user' },
                           config.secret,
                           { expiresIn: config.jwtExpiration });

    res.status(200).send({
      message: "Đăng nhập thành công!",
      id: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      accessToken: token
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.staffSignin = async (req, res) => {
  try {
    const staff = await Staff.findOne({
      where: {
        email: req.body.email
      }
    });

    if (!staff) {
      return res.status(404).send({ message: "Không tìm thấy nhân viên." });
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      staff.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Mật khẩu không đúng!"
      });
    }

    const token = jwt.sign(
      { id: staff.staff_id, role: staff.role, type: 'staff' },
      config.secret,
      { expiresIn: config.jwtExpiration }
    );    
    

    res.status(200).send({
      id: staff.staff_id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      accessToken: token
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.registerStaff = async (req, res) => {
  try {
    // Chỉ managers mới được đăng ký nhân viên mới
    if (req.role !== 'manager') {
      return res.status(403).send({ message: "Không có quyền thực hiện!" });
    }
    
    await Staff.create({
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      phone: req.body.phone,
      role: req.body.role || 'employee',
      hire_date: new Date()
    });

    res.status(200).send({ message: "Đăng ký nhân viên thành công!" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};