const authJwt = require("../middlewares/authJwt");
const controller = require("../controllers/product.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Lấy tất cả sản phẩm (với phân trang)
  // GET /api/products?page=1&size=10
  app.get("/api/products", controller.getAllProducts);

  // Lấy sản phẩm theo ID
  app.get("/api/products/:id", controller.getProductById);

  // Lấy sản phẩm theo danh mục (với phân trang)
  // GET /api/products/category/:categoryId?page=1&size=10
  app.get("/api/products/category/:categoryId", controller.getProductsByCategory);

  // Thêm sản phẩm mới (chỉ manager)
  app.post(
    "/api/products",
    [authJwt.verifyToken, authJwt.isManager],
    controller.createProduct
  );

  // Cập nhật thông tin sản phẩm (chỉ manager)
  app.put(
    "/api/products/:id",
    [authJwt.verifyToken, authJwt.isManager],
    controller.updateProduct
  );

  // Xóa sản phẩm (chỉ manager)
  app.delete(
    "/api/products/:id",
    [authJwt.verifyToken, authJwt.isManager],
    controller.deleteProduct
  );

  // Tìm kiếm sản phẩm (với phân trang)
  // GET /api/products/search/:keyword?page=1&size=10
  app.get("/api/products/search/:keyword", controller.searchProducts);

  // Lấy tất cả danh mục (có thể với phân trang)
  // GET /api/categories?page=1&size=10 hoặc GET /api/categories
  app.get("/api/categories", controller.getAllCategories);

  // Thêm danh mục mới (chỉ manager)
  app.post(
    "/api/categories",
    [authJwt.verifyToken, authJwt.isManager],
    controller.createCategory
  );

  // Cập nhật danh mục 
  app.put(
    "/api/categories/:id",
    [authJwt.verifyToken, authJwt.isManager],
    controller.updateCategory
  );

  // Xóa danh mục 
  app.delete(
    "/api/categories/:id", 
    [authJwt.verifyToken, authJwt.isManager],
    controller.deleteCategory
  );

  // Đánh giá sản phẩm
  app.post(
    "/api/products/:id/reviews",
    [authJwt.verifyToken],
    controller.addReview
  );

  // Lấy đánh giá của sản phẩm (với phân trang)
  // GET /api/products/:id/reviews?page=1&size=10
  app.get("/api/products/:id/reviews", controller.getProductReviews);
};