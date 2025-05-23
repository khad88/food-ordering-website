// routes/order.routes.js
const express = require("express");
const orderController = require("../controllers/order.controller");
const authJwt = require("../middlewares/authJwt");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Tạo đơn hàng từ giỏ hàng (người dùng)
  app.post(
    "/api/orders",
    [authJwt.verifyToken],
    orderController.createFromCart
  );

  // Lấy tất cả đơn hàng (phân quyền)
  app.get(
    "/api/orders",
    [authJwt.verifyToken],
    orderController.getAllOrders
  );

  // Xem chi tiết đơn hàng (phân quyền)
  app.get(
    "/api/orders/:id",
    [authJwt.verifyToken],
    orderController.getOrderById
  );

// Cập nhật trạng thái đơn hàng và thanh toán (chỉ nhân viên)
app.put(
  "/api/orders/:id/status",
  [authJwt.verifyToken, authJwt.isStaff],
  orderController.updateOrderStatus
);

  // Hủy đơn hàng
  app.put(
    "/api/orders/:id/cancel", 
    [authJwt.verifyToken],
    orderController.cancelOrder
  );

  // Tạo đơn hàng trực tiếp không qua giỏ hàng
app.post(
  "/api/orders/direct",
  [authJwt.verifyToken], // Đảm bảo người dùng đã đăng nhập
  orderController.createDirectOrder
);
};