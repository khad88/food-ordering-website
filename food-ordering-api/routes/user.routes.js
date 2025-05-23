const authJwt = require("../middlewares/authJwt");
const controller = require("../controllers/user.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Lấy thông tin người dùng hiện tại
  app.get(
    "/api/users/profile",
    [authJwt.verifyToken],
    controller.getUserProfile
  );

  // Cập nhật thông tin người dùng
  app.put(
    "/api/users/profile",
    [authJwt.verifyToken],
    controller.updateUserProfile
  );

  // Thay đổi mật khẩu
  app.put(
    "/api/users/password",
    [authJwt.verifyToken],
    controller.changePassword
  );

  // Quản lý giỏ hàng - Thêm sản phẩm vào giỏ
  app.post(
    "/api/cart/items",
    [authJwt.verifyToken],
    controller.addToCart
  );

  // Quản lý giỏ hàng - Lấy giỏ hàng của người dùng
  app.get(
    "/api/cart",
    [authJwt.verifyToken],
    controller.getCart
  );

  // Quản lý giỏ hàng - Cập nhật số lượng sản phẩm
  app.put(
    "/api/cart/items/:id",
    [authJwt.verifyToken],
    controller.updateCartItem
  );

  // Quản lý giỏ hàng - Xóa sản phẩm khỏi giỏ
  app.delete(
    "/api/cart/items/:id",
    [authJwt.verifyToken],
    controller.removeFromCart
  );

  // Xóa toàn bộ giỏ hàng
  app.delete(
    "/api/cart",
    [authJwt.verifyToken],
    controller.clearCart
  );

  // Lấy lịch sử đánh giá của người dùng
  app.get(
    "/api/users/reviews",
    [authJwt.verifyToken],
    controller.getUserReviews
  );
};