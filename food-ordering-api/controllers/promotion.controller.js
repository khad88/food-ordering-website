const db = require("../models");
const Promotion = db.promotions;
const Product = db.products;
const ProductPromotion = db.productPromotions;
const { Op } = require("sequelize");

// Lấy tất cả khuyến mãi với phân trang
exports.getAllPromotions = (req, res) => {
  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Get total count for pagination
  Promotion.count()
    .then(count => {
      Promotion.findAll({
        limit: limit,
        offset: offset
      })
        .then(promotions => {
          res.status(200).send({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            promotions: promotions
          });
        })
        .catch(err => {
          res.status(500).send({
            message: err.message || "Đã xảy ra lỗi khi lấy danh sách khuyến mãi."
          });
        });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi đếm tổng số khuyến mãi."
      });
    });
};

// Lấy khuyến mãi đang hoạt động với phân trang
exports.getActivePromotions = (req, res) => {
  const currentDate = new Date();
  
  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const condition = {
    is_active: true,
    start_date: { [Op.lte]: currentDate },
    end_date: { [Op.gte]: currentDate }
  };

  // Get total count for pagination
  Promotion.count({
    where: condition
  })
    .then(count => {
      Promotion.findAll({
        where: condition,
        limit: limit,
        offset: offset
      })
        .then(promotions => {
          res.status(200).send({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            promotions: promotions
          });
        })
        .catch(err => {
          res.status(500).send({
            message: err.message || "Đã xảy ra lỗi khi lấy danh sách khuyến mãi đang hoạt động."
          });
        });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi đếm tổng số khuyến mãi đang hoạt động."
      });
    });
};

// Lấy thông tin một khuyến mãi
exports.getPromotionById = (req, res) => {
  const id = req.params.id;

  Promotion.findByPk(id)
    .then(promotion => {
      if (promotion) {
        res.status(200).send(promotion);
      } else {
        res.status(404).send({
          message: `Không tìm thấy khuyến mãi với id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: `Lỗi khi lấy thông tin khuyến mãi với id=${id}.`
      });
    });
};

// Tạo khuyến mãi mới
exports.createPromotion = (req, res) => {
  // Validate request
  if (!req.body.title || !req.body.discount_percent || !req.body.start_date || !req.body.end_date) {
    res.status(400).send({
      message: "Không thể để trống thông tin khuyến mãi!"
    });
    return;
  }

  // Tạo khuyến mãi
  const promotion = {
    title: req.body.title,
    description: req.body.description,
    discount_percent: req.body.discount_percent,
    start_date: req.body.start_date,
    end_date: req.body.end_date,
    is_active: req.body.is_active !== undefined ? req.body.is_active : true
  };

  Promotion.create(promotion)
    .then(data => {
      res.status(201).send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi tạo khuyến mãi."
      });
    });
};

// Cập nhật khuyến mãi
exports.updatePromotion = (req, res) => {
  const id = req.params.id;

  Promotion.update(req.body, {
    where: { promotion_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Cập nhật thông tin khuyến mãi thành công."
        });
      } else {
        res.send({
          message: `Không thể cập nhật khuyến mãi với id=${id}. Có thể khuyến mãi không tồn tại!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: `Lỗi khi cập nhật khuyến mãi với id=${id}.`
      });
    });
};

// Xóa khuyến mãi
exports.deletePromotion = (req, res) => {
  const id = req.params.id;

  Promotion.destroy({
    where: { promotion_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Xóa khuyến mãi thành công!"
        });
      } else {
        res.send({
          message: `Không thể xóa khuyến mãi với id=${id}. Có thể khuyến mãi không tồn tại!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: `Lỗi khi xóa khuyến mãi với id=${id}.`
      });
    });
};

// Gán khuyến mãi cho sản phẩm
exports.assignPromotionToProduct = (req, res) => {
  // Validate request
  if (!req.body.product_id || !req.body.promotion_id) {
    res.status(400).send({
      message: "Cần cung cấp đầy đủ thông tin product_id và promotion_id!"
    });
    return;
  }

  const productPromotion = {
    product_id: req.body.product_id,
    promotion_id: req.body.promotion_id
  };

  // Kiểm tra sản phẩm và khuyến mãi tồn tại
  Promise.all([
    Product.findByPk(req.body.product_id),
    Promotion.findByPk(req.body.promotion_id)
  ])
    .then(([product, promotion]) => {
      if (!product) {
        return res.status(404).send({
          message: `Không tìm thấy sản phẩm với id=${req.body.product_id}.`
        });
      }
      
      if (!promotion) {
        return res.status(404).send({
          message: `Không tìm thấy khuyến mãi với id=${req.body.promotion_id}.`
        });
      }

      // Tạo liên kết giữa sản phẩm và khuyến mãi
      return ProductPromotion.create(productPromotion);
    })
    .then(data => {
      if (data) {
        res.status(201).send({
          message: "Gán khuyến mãi cho sản phẩm thành công!",
          data: data
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi gán khuyến mãi cho sản phẩm."
      });
    });
};

// Hủy gán khuyến mãi cho sản phẩm
exports.removePromotionFromProduct = (req, res) => {
  const productId = req.params.productId;
  const promotionId = req.params.promotionId;

  ProductPromotion.destroy({
    where: { 
      product_id: productId,
      promotion_id: promotionId
    }
  })
    .then(num => {
      if (num > 0) {
        res.send({
          message: "Đã hủy gán khuyến mãi cho sản phẩm thành công!"
        });
      } else {
        res.send({
          message: `Không tìm thấy liên kết giữa sản phẩm (id=${productId}) và khuyến mãi (id=${promotionId}).`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: `Lỗi khi hủy gán khuyến mãi: ${err.message}`
      });
    });
};

// Lấy tất cả sản phẩm có khuyến mãi với phân trang
exports.getProductsWithPromotion = (req, res) => {
  const promotionId = req.params.promotionId;
  
  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Get total count for pagination
  Product.count({
    include: [{
      model: Promotion,
      where: { promotion_id: promotionId },
      through: {
        attributes: []
      },
      attributes: []
    }]
  })
    .then(count => {
      Product.findAll({
        include: [{
          model: Promotion,
          where: { promotion_id: promotionId },
          through: {
            attributes: []
          },
          attributes: []
        }],
        limit: limit,
        offset: offset
      })
        .then(products => {
          res.status(200).send({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            products: products
          });
        })
        .catch(err => {
          res.status(500).send({
            message: err.message || "Đã xảy ra lỗi khi lấy danh sách sản phẩm có khuyến mãi."
          });
        });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi đếm tổng số sản phẩm có khuyến mãi."
      });
    });
};

// Lấy tất cả khuyến mãi của một sản phẩm với phân trang
exports.getPromotionsForProduct = (req, res) => {
  const productId = req.params.productId;
  
  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Get total count for pagination
  Promotion.count({
    include: [{
      model: Product,
      where: { product_id: productId },
      through: {
        attributes: []
      },
      attributes: []
    }]
  })
    .then(count => {
      Promotion.findAll({
        include: [{
          model: Product,
          where: { product_id: productId },
          through: {
            attributes: []
          },
          attributes: []
        }],
        limit: limit,
        offset: offset
      })
        .then(promotions => {
          res.status(200).send({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            promotions: promotions
          });
        })
        .catch(err => {
          res.status(500).send({
            message: err.message || "Đã xảy ra lỗi khi lấy danh sách khuyến mãi của sản phẩm."
          });
        });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi đếm tổng số khuyến mãi của sản phẩm."
      });
    });
};