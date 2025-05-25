const db = require("../models");
const bcrypt = require("bcryptjs");
const User = db.users;
const Cart = db.carts;
const CartItem = db.cartItems;
const Product = db.products;
const Review = db.reviews;

// Lấy thông tin người dùng hiện tại
exports.getUserProfile = (req, res) => {
  User.findByPk(req.userId, {
    attributes: { exclude: ['password'] }
  })
    .then(user => {
      if (!user) {
        return res.status(404).send({
          message: "Không tìm thấy thông tin người dùng."
        });
      }
      res.status(200).send(user);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi lấy thông tin người dùng."
      });
    });
};

// Cập nhật thông tin người dùng
exports.updateUserProfile = (req, res) => {
  // Loại bỏ những trường không cho phép người dùng cập nhật
  const updateData = {
    name: req.body.name,
    phone: req.body.phone,
    address: req.body.address
  };

  User.update(updateData, {
    where: { user_id: req.userId }
  })
    .then(num => {
      if (num == 1) {
        res.status(200).send({
          message: "Cập nhật thông tin thành công."
        });
      } else {
        res.status(404).send({
          message: "Không thể cập nhật thông tin người dùng."
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi cập nhật thông tin."
      });
    });
};

// Thay đổi mật khẩu
exports.changePassword = (req, res) => {
  // Kiểm tra dữ liệu
  if (!req.body.oldPassword || !req.body.newPassword) {
    return res.status(400).send({
      message: "Mật khẩu cũ và mật khẩu mới không được để trống!"
    });
  }

  // Tìm người dùng
  User.findByPk(req.userId)
    .then(user => {
      if (!user) {
        return res.status(404).send({
          message: "Không tìm thấy thông tin người dùng."
        });
      }

      // Kiểm tra mật khẩu cũ
      const passwordIsValid = bcrypt.compareSync(
        req.body.oldPassword,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          message: "Mật khẩu cũ không chính xác!"
        });
      }

      // Cập nhật mật khẩu mới
      user.update({
        password: bcrypt.hashSync(req.body.newPassword, 8)
      })
        .then(() => {
          res.status(200).send({
            message: "Thay đổi mật khẩu thành công!"
          });
        })
        .catch(err => {
          res.status(500).send({
            message: err.message || "Đã xảy ra lỗi khi thay đổi mật khẩu."
          });
        });
    })
    .catch(err => {
        res.status(500).send({
          message: err.message || "Đã xảy ra lỗi khi tìm kiếm thông tin người dùng."
        });
      });
  };
  
  // Thêm sản phẩm vào giỏ hàng
  exports.addToCart = async (req, res) => {
    try {
      // Kiểm tra dữ liệu
      if (!req.body.product_id || !req.body.quantity) {
        return res.status(400).send({
          message: "ID sản phẩm và số lượng không được để trống!"
        });
      }
  
      // Tìm hoặc tạo giỏ hàng cho người dùng
      let cart = await Cart.findOne({ where: { user_id: req.userId } });
      
      if (!cart) {
        cart = await Cart.create({ user_id: req.userId });
      }
  
      // Kiểm tra sản phẩm tồn tại
      const product = await Product.findByPk(req.body.product_id);
      if (!product) {
        return res.status(404).send({
          message: "Không tìm thấy sản phẩm!"
        });
      }
  
      // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
      const cartItem = await CartItem.findOne({
        where: { 
          cart_id: cart.cart_id,
          product_id: req.body.product_id
        }
      });
  
      if (cartItem) {
        // Nếu đã có, cập nhật số lượng
        await cartItem.update({ 
          quantity: cartItem.quantity + parseInt(req.body.quantity) 
        });
        
        res.status(200).send({
          message: "Đã cập nhật số lượng sản phẩm trong giỏ hàng!",
          cartItem
        });
      } else {
        // Nếu chưa có, thêm mới vào giỏ hàng
        const newItem = await CartItem.create({
          cart_id: cart.cart_id,
          product_id: req.body.product_id,
          quantity: req.body.quantity
        });
        
        res.status(201).send({
          message: "Đã thêm sản phẩm vào giỏ hàng!",
          cartItem: newItem
        });
      }
    } catch (err) {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi thêm sản phẩm vào giỏ hàng."
      });
    }
  };
  
// Lấy giỏ hàng của người dùng
exports.getCart = async (req, res) => {
  try {
    // Lấy page và size từ query params
    let { page, size } = req.query;
    page = page ? parseInt(page) : 1;
    size = size ? parseInt(size) : 10;

    const offset = (page - 1) * size;
    const limit = size;

    // Tìm giỏ hàng của người dùng
    let cart = await Cart.findOne({
      where: { user_id: req.userId }
    });

    // Nếu chưa có giỏ hàng, tạo mới
    if (!cart) {
      cart = await Cart.create({ user_id: req.userId });
    }

    // Lấy các item trong giỏ hàng có phân trang + include Product
    const cartItems = await CartItem.findAll({
      where: { cart_id: cart.cart_id },
      include: [
        {
          model: Product,
          attributes: ["product_id", "name", "description", "price", "image_url", "category_id", "is_active"]
        }
      ],
      offset,
      limit
    });

    // Đếm tổng số item (tính cho tất cả phân trang)
    const totalItems = await CartItem.count({
      where: { cart_id: cart.cart_id }
    });

    // Tính tổng số lượng và tổng giá tiền
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => {
      return sum + item.quantity * parseFloat(item.Product?.price || 0);
    }, 0);

    // Trả dữ liệu đúng với frontend
    res.status(200).json({
      totalItems,
      totalPages: Math.ceil(totalItems / size),
      currentPage: page,
      cart: {
        cart_id: cart.cart_id,
        user_id: cart.user_id,
        cart_items: cartItems,
        totalQuantity,
        totalPrice
      }
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Đã xảy ra lỗi khi lấy thông tin giỏ hàng."
    });
  }
};
  // Cập nhật số lượng sản phẩm trong giỏ hàng
  exports.updateCartItem = async (req, res) => {
    try {
      const cartItemId = req.params.id;
      
      // Kiểm tra dữ liệu
      if (!req.body.quantity) {
        return res.status(400).send({
          message: "Số lượng không được để trống!"
        });
      }
      
      // Tìm item trong giỏ hàng
      const cartItem = await CartItem.findByPk(cartItemId);
      
      if (!cartItem) {
        return res.status(404).send({
          message: "Không tìm thấy sản phẩm trong giỏ hàng!"
        });
      }
      
      // Kiểm tra quyền sở hữu giỏ hàng
      const cart = await Cart.findByPk(cartItem.cart_id);
      
      if (cart.user_id !== req.userId) {
        return res.status(403).send({
          message: "Bạn không có quyền thực hiện hành động này!"
        });
      }
      
      // Cập nhật số lượng
      if (req.body.quantity <= 0) {
        // Nếu số lượng <= 0, xóa sản phẩm khỏi giỏ hàng
        await cartItem.destroy();
        res.status(200).send({
          message: "Đã xóa sản phẩm khỏi giỏ hàng!"
        });
      } else {
        // Cập nhật số lượng mới
        await cartItem.update({ quantity: req.body.quantity });
        res.status(200).send({
          message: "Đã cập nhật số lượng sản phẩm!"
        });
      }
    } catch (err) {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi cập nhật giỏ hàng."
      });
    }
  };
  
  // Xóa sản phẩm khỏi giỏ hàng
  exports.removeFromCart = async (req, res) => {
    try {
      const cartItemId = req.params.id;
      
      // Tìm item trong giỏ hàng
      const cartItem = await CartItem.findByPk(cartItemId);
      
      if (!cartItem) {
        return res.status(404).send({
          message: "Không tìm thấy sản phẩm trong giỏ hàng!"
        });
      }
      
      // Kiểm tra quyền sở hữu giỏ hàng
      const cart = await Cart.findByPk(cartItem.cart_id);
      
      if (cart.user_id !== req.userId) {
        return res.status(403).send({
          message: "Bạn không có quyền thực hiện hành động này!"
        });
      }
      
      // Xóa sản phẩm khỏi giỏ hàng
      await cartItem.destroy();
      
      res.status(200).send({
        message: "Đã xóa sản phẩm khỏi giỏ hàng!"
      });
    } catch (err) {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi xóa sản phẩm khỏi giỏ hàng."
      });
    }
  };
  
  // Xóa toàn bộ giỏ hàng
  exports.clearCart = async (req, res) => {
    try {
      // Tìm giỏ hàng của người dùng
      const cart = await Cart.findOne({ where: { user_id: req.userId } });
      
      if (!cart) {
        return res.status(404).send({
          message: "Không tìm thấy giỏ hàng!"
        });
      }
      
      // Xóa tất cả sản phẩm trong giỏ hàng
      await CartItem.destroy({ where: { cart_id: cart.cart_id } });
      
      res.status(200).send({
        message: "Đã xóa toàn bộ giỏ hàng!"
      });
    } catch (err) {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi xóa giỏ hàng."
      });
    }
  };
  
  // Lấy lịch sử đánh giá của người dùng (với phân trang)
  exports.getUserReviews = async (req, res) => {
    try {
      // Lấy thông số phân trang từ query parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      
      // Đếm tổng số bản ghi để tính toán thông tin phân trang
      const totalItems = await Review.count({
        where: { user_id: req.userId }
      });
      
      // Lấy danh sách đánh giá với phân trang
      const reviews = await Review.findAll({
        where: { user_id: req.userId },
        include: [{
          model: Product,
          attributes: ["product_id", "name", "image_url"]
        }],
        order: [["review_time", "DESC"]],
        limit: limit,
        offset: offset
      });
      
      // Tính toán thông tin phân trang
      const totalPages = Math.ceil(totalItems / limit);
      
      res.status(200).send({
        totalItems,
        reviews,
        totalPages,
        currentPage: page,
        itemsPerPage: limit
      });
    } catch (err) {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi lấy lịch sử đánh giá."
      });
    }
  };