// middlewares/authJwt.js
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.users;
const Staff = db.staffs;

verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({
      message: "Không tìm thấy token!"
    });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!"
      });
    }
    if (decoded.type === 'user') {
      req.userId = decoded.id;
      req.userType = 'user'; 
    } else if (decoded.type === 'staff') {
      req.userId = decoded.id;
      req.staffId = decoded.id;
      req.role = decoded.role;
      req.userType = 'staff'; 
    }
    next();
  });
};

isManager = (req, res, next) => {
  if (!req.staffId) {
    return res.status(403).send({
      message: "Chỉ dành cho manager!"
    });
  }

  Staff.findByPk(req.staffId).then(staff => {
    if (staff && staff.role === "manager") {
      next();
      return;
    }
    
    res.status(403).send({
      message: "Yêu cầu quyền Manager!"
    });
  });
};

isStaff = (req, res, next) => {
  if (!req.staffId) {
    return res.status(403).send({
      message: "Chỉ dành cho nhân viên!"
    });
  }
  next();
};

const authJwt = {
  verifyToken: verifyToken,
  isManager: isManager,
  isStaff: isStaff
};

module.exports = authJwt;