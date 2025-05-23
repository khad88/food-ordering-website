const authJwt = require("../middlewares/authJwt");
const controller = require("../controllers/dashboard.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Lấy thống kê chung (dành cho manager)
  app.get(
    "/api/dashboard/summary",
    [authJwt.verifyToken, authJwt.isManager],
    controller.getSummary
  );

  // Lấy thống kê doanh thu theo ngày
  app.get(
    "/api/dashboard/revenue/daily",
    [authJwt.verifyToken, authJwt.isManager],
    controller.getDailyRevenue
  );

  // Lấy thống kê doanh thu theo tháng
  app.get(
    "/api/dashboard/revenue/monthly",
    [authJwt.verifyToken, authJwt.isManager],
    controller.getMonthlyRevenue
  );

  // Lấy thống kê top sản phẩm bán chạy
  app.get(
    "/api/dashboard/products/top",
    [authJwt.verifyToken, authJwt.isStaff],
    controller.getTopProducts
  );

  // Lấy thống kê theo danh mục
  app.get(
    "/api/dashboard/categories/performance",
    [authJwt.verifyToken, authJwt.isManager],
    controller.getCategoryPerformance
  );

  // Lấy thống kê đơn hàng theo trạng thái
  app.get(
    "/api/dashboard/orders/status",
    [authJwt.verifyToken, authJwt.isStaff],
    controller.getOrderStatusStats
  );
};