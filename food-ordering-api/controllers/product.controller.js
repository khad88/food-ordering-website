const db = require("../models");
const Product = db.products;
const Category = db.categories;
const Review = db.reviews;
const User = db.users;
const { Op } = require("sequelize");
const removeAccents = require('remove-accents');

// Lấy tất cả sản phẩm với phân trang
exports.getAllProducts = (req, res) => {
  const { page = 1, size = 10 } = req.query;
  const limit = parseInt(size);
  const offset = (parseInt(page) - 1) * limit;

  Product.findAndCountAll({
    limit,
    offset,
    include: [
      {
        model: Category,
        as: "category",
        attributes: ["category_id", "category_name"]
      }
    ],
    order: [["product_id", "ASC"]]
  })
    .then(data => {
      const totalItems = data.count;
      const totalPages = Math.ceil(totalItems / limit);
      const currentPage = parseInt(page);

      res.status(200).send({
        totalItems,
        totalPages,
        currentPage,
        pageSize: limit,
        products: data.rows
      });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi lấy danh sách sản phẩm."
      });
    });
};

// Lấy sản phẩm theo ID và đánh giá với phân trang
exports.getProductById = async (req, res) => {
  const id = req.params.id;
  const { page = 1, size = 10 } = req.query; // Lấy thông tin phân trang từ query

  try {
    // Tìm sản phẩm theo ID
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["category_id", "category_name"]
        }
      ]
    });

    if (!product) {
      return res.status(404).send({
        message: `Không tìm thấy sản phẩm với ID: ${id}`
      });
    }

    // Lấy đánh giá của sản phẩm với phân trang
    const limit = parseInt(size);
    const offset = (parseInt(page) - 1) * limit;

    const reviewsData = await Review.findAndCountAll({
      where: { product_id: id },
      limit,
      offset,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["user_id", "name"]
        }
      ],
      order: [["review_time", "DESC"]]
    });

    const totalItems = reviewsData.count;
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = parseInt(page);

    // Trả về thông tin sản phẩm và đánh giá
    res.status(200).send({
      product,
      reviews: {
        totalItems,
        totalPages,
        currentPage,
        pageSize: limit,
        data: reviewsData.rows
      }
    });
  } catch (error) {
    res.status(500).send({
      message: `Lỗi khi lấy thông tin sản phẩm với ID: ${id}`
    });
  }
};

// Lấy sản phẩm theo danh mục với phân trang
exports.getProductsByCategory = (req, res) => {
  const categoryId = req.params.categoryId;
  const { page = 1, size = 10 } = req.query;
  const limit = parseInt(size);
  const offset = (parseInt(page) - 1) * limit;

  Product.findAndCountAll({
    where: { category_id: categoryId },
    limit,
    offset,
    include: [
      {
        model: Category,
        as: "category",
        attributes: ["category_id", "category_name"]
      }
    ],
    order: [["product_id", "ASC"]]
  })
    .then(data => {
      const totalItems = data.count;
      const totalPages = Math.ceil(totalItems / limit);
      const currentPage = parseInt(page);

      res.status(200).send({
        totalItems,
        totalPages,
        currentPage,
        pageSize: limit,
        products: data.rows
      });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi lấy sản phẩm theo danh mục."
      });
    });
};

// Thêm sản phẩm mới
exports.createProduct = (req, res) => {
  // Validate request
  if (!req.body.name || !req.body.price || !req.body.category_id) {
    return res.status(400).send({
      message: "Tên sản phẩm, giá và danh mục không được để trống!"
    });
  }

  // Tạo sản phẩm mới
  const product = {
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    image_url: req.body.image_url,
    category_id: req.body.category_id,
    is_active: req.body.is_active !== undefined ? req.body.is_active : true
  };

  // Lưu sản phẩm vào database
  Product.create(product)
    .then(data => {
      res.status(201).send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi tạo sản phẩm mới."
      });
    });
};

// Cập nhật thông tin sản phẩm
exports.updateProduct = (req, res) => {
  const id = req.params.id;

  Product.update(req.body, {
    where: { product_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.status(200).send({
          message: "Cập nhật sản phẩm thành công."
        });
      } else {
        res.status(404).send({
          message: `Không thể cập nhật sản phẩm với ID: ${id}. Có thể sản phẩm không tồn tại!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: `Lỗi khi cập nhật sản phẩm với ID: ${id}`
      });
    });
};

// Xóa sản phẩm
exports.deleteProduct = (req, res) => {
  const id = req.params.id;

  Product.destroy({
    where: { product_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.status(200).send({
          message: "Xóa sản phẩm thành công!"
        });
      } else {
        res.status(404).send({
          message: `Không thể xóa sản phẩm với ID: ${id}. Có thể sản phẩm không tồn tại!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: `Lỗi khi xóa sản phẩm với ID: ${id}`
      });
    });
};

// Tìm kiếm sản phẩm với phân trang
exports.searchProducts = (req, res) => {
  let keyword = req.params.keyword;
  const { page = 1, size = 10 } = req.query;
  const limit = parseInt(size);
  const offset = (parseInt(page) - 1) * limit;

  // Thay đổi dấu gạch ngang thành khoảng trắng
  keyword = keyword.replace(/-/g, " ");

  // Chuẩn hóa keyword: loại bỏ dấu và chuyển thành chữ thường
  const normalizedKeyword = removeAccents(keyword).toLowerCase();

  // Tách từ khóa thành các từ con
  const searchTerms = normalizedKeyword.split(" ");

  // Tạo điều kiện tìm kiếm cho mỗi từ trong từ khóa
  const searchConditions = searchTerms.map(term => ({
    [Op.or]: [
      { name: { [Op.like]: `%${term}%` } },
      { description: { [Op.like]: `%${term}%` } }
    ]
  }));

  // Tìm kiếm sản phẩm với các điều kiện tìm kiếm
  Product.findAndCountAll({
    where: {
      [Op.and]: searchConditions // Tìm các sản phẩm có tất cả các từ khóa trong đó
    },
    limit,
    offset,
    include: [
      {
        model: Category,
        as: "category",
        attributes: ["category_id", "category_name"]
      }
    ],
    order: [["product_id", "ASC"]]
  })
    .then(data => {
      const totalItems = data.count;
      const totalPages = Math.ceil(totalItems / limit);
      const currentPage = parseInt(page);

      res.status(200).send({
        totalItems,
        totalPages,
        currentPage,
        pageSize: limit,
        products: data.rows
      });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi tìm kiếm sản phẩm."
      });
    });
};

// Lấy tất cả danh mục với phân trang
exports.getAllCategories = (req, res) => {
  const { page, size } = req.query;
  
  // Nếu không có tham số phân trang, trả về tất cả danh mục
  if (!page || !size) {
    Category.findAll()
      .then(categories => {
        res.status(200).send(categories);
      })
      .catch(err => {
        res.status(500).send({
          message: err.message || "Đã xảy ra lỗi khi lấy danh sách danh mục."
        });
      });
    return;
  }
  
  const limit = parseInt(size);
  const offset = (parseInt(page) - 1) * limit;

  Category.findAndCountAll({
    limit,
    offset,
    order: [["category_id", "ASC"]]
  })
    .then(data => {
      const totalItems = data.count;
      const totalPages = Math.ceil(totalItems / limit);
      const currentPage = parseInt(page);

      res.status(200).send({
        totalItems,
        totalPages,
        currentPage,
        pageSize: limit,
        categories: data.rows
      });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi lấy danh sách danh mục."
      });
    });
};

// Thêm danh mục mới
exports.createCategory = (req, res) => {
  // Validate request
  if (!req.body.category_name) {
    return res.status(400).send({
      message: "Tên danh mục không được để trống!"
    });
  }

  // Tạo danh mục mới
  const category = {
    category_name: req.body.category_name
  };

  // Lưu danh mục vào database
  Category.create(category)
    .then(data => {
      res.status(201).send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi tạo danh mục mới."
      });
    });
};

// Thêm đánh giá cho sản phẩm
exports.addReview = (req, res) => {
  // Validate request
  if (!req.body.rating) {
    return res.status(400).send({
      message: "Đánh giá không được để trống!"
    });
  }

  const productId = req.params.id;
  const userId = req.userId;

  // Kiểm tra sản phẩm tồn tại
  Product.findByPk(productId)
    .then(product => {
      if (!product) {
        return res.status(404).send({
          message: `Không tìm thấy sản phẩm với ID: ${productId}`
        });
      }

      // Tạo đánh giá mới
      const review = {
        user_id: userId,
        product_id: productId,
        rating: req.body.rating,
        comment: req.body.comment
      };

      // Lưu đánh giá vào database
      Review.create(review)
        .then(data => {
          res.status(201).send(data);
        })
        .catch(err => {
          res.status(500).send({
            message: err.message || "Đã xảy ra lỗi khi thêm đánh giá."
          });
        });
    })
    .catch(err => {
      res.status(500).send({
        message: `Lỗi khi kiểm tra sản phẩm với ID: ${productId}`
      });
    });
};

// Lấy đánh giá của sản phẩm với phân trang
exports.getProductReviews = (req, res) => {
  const productId = req.params.id;
  const { page = 1, size = 10 } = req.query;
  const limit = parseInt(size);
  const offset = (parseInt(page) - 1) * limit;

  Review.findAndCountAll({
    where: { product_id: productId },
    limit,
    offset,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["user_id", "name"]
      }
    ],
    order: [["review_time", "DESC"]]
  })
    .then(data => {
      const totalItems = data.count;
      const totalPages = Math.ceil(totalItems / limit);
      const currentPage = parseInt(page);

      res.status(200).send({
        totalItems,
        totalPages,
        currentPage,
        pageSize: limit,
        reviews: data.rows
      });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi lấy đánh giá sản phẩm."
      });
    });
};

// Cập nhật danh mục
exports.updateCategory = (req, res) => {
  const id = req.params.id;

  Category.update(
    { category_name: req.body.category_name },
    { where: { category_id: id } }
  )
    .then(num => {
      if (num == 1) {
        res.status(200).send({
          message: "Cập nhật danh mục thành công."
        });
      } else {
        res.status(404).send({
          message: `Không thể cập nhật danh mục với ID: ${id}. Có thể danh mục không tồn tại!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: `Lỗi khi cập nhật danh mục với ID: ${id}`
      });
    });
};

// Xóa danh mục
exports.deleteCategory = (req, res) => {
  const id = req.params.id;

  Category.destroy({
    where: { category_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.status(200).send({
          message: "Xóa danh mục thành công!"
        });
      } else {
        res.status(404).send({
          message: `Không thể xóa danh mục với ID: ${id}. Có thể danh mục không tồn tại hoặc đã được sử dụng trong sản phẩm!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: `Lỗi khi xóa danh mục với ID: ${id}`
      });
    });
};