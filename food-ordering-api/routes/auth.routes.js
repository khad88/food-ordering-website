const verifySignUp = require("../middlewares/verifySignUp");
const controller = require("../controllers/auth.controller");
const authJwt  = require("../middlewares/authJwt"); 

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Đăng ký tài khoản người dùng
  app.post(
    "/api/auth/signup",
    [
      verifySignUp.checkDuplicateEmail,  // Middleware kiểm tra email trùng lặp
      verifySignUp.validateSignupData    // Middleware kiểm tra dữ liệu đăng ký
    ],
    controller.signup
  );

  // Đăng nhập người dùng
  app.post("/api/auth/signin", controller.signin);


  // Đăng ký tài khoản nhân viên (chỉ cho manager)
  app.post(
    "/api/auth/staff/register",
    [
      authJwt.verifyToken,
      authJwt.isManager,
      verifySignUp.checkDuplicateEmail,
      verifySignUp.validateSignupData
    ],
    controller.registerStaff
  );
  

  // Đăng nhập nhân viên
  app.post("/api/auth/staff/signin", controller.staffSignin);
};