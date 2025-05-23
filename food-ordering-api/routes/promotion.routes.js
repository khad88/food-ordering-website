const authJwt = require("../middlewares/authJwt");
const controller = require("../controllers/promotion.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Lấy tất cả khuyến mãi
  app.get("/api/promotions", controller.getAllPromotions);

  // Lấy khuyến mãi đang hoạt động
  app.get("/api/promotions/active", controller.getActivePromotions);

  // Lấy khuyến mãi theo ID
  app.get("/api/promotions/:id", controller.getPromotionById);

  // Tạo khuyến mãi mới (chỉ manager)
  app.post(
    "/api/promotions",
    [authJwt.verifyToken, authJwt.isManager],
    controller.createPromotion
  );

  // Cập nhật khuyến mãi (chỉ manager)
  app.put(
    "/api/promotions/:id",
    [authJwt.verifyToken, authJwt.isManager],
    controller.updatePromotion
  );

  // Xóa khuyến mãi (chỉ manager)
  app.delete(
    "/api/promotions/:id",
    [authJwt.verifyToken, authJwt.isManager],
    controller.deletePromotion
  );

  // Gán khuyến mãi cho sản phẩm (chỉ manager)
  app.post(
    "/api/promotions/assign",
    [authJwt.verifyToken, authJwt.isManager],
    controller.assignPromotionToProduct
  );

  // Hủy gán khuyến mãi cho sản phẩm (chỉ manager)
  app.delete(
    "/api/promotions/remove/:productId/:promotionId",
    [authJwt.verifyToken, authJwt.isManager],
    controller.removePromotionFromProduct
  );

  // Lấy tất cả sản phẩm có một khuyến mãi
  app.get(
    "/api/promotions/:promotionId/products",
    controller.getProductsWithPromotion
  );

  // Lấy tất cả khuyến mãi của một sản phẩm
  app.get(
    "/api/products/:productId/promotions",
    controller.getPromotionsForProduct
  );
};