// controllers/order.controller.js
const db = require("../models");
const Order = db.orders;
const OrderDetail = db.orderDetails;
const OrderStatusHistory = db.orderStatusHistory;
const Product = db.products;
const User = db.users;
const Cart = db.carts;
const CartItem = db.cartItems;
const Payment = db.payments;
const Promotion = db.promotions;

// Hàm kiểm tra và áp dụng khuyến mãi
async function applyPromotion(totalPrice, promotionId) {
  if (!promotionId) return totalPrice;

  const promotion = await Promotion.findOne({
    where: {
      promotion_id: promotionId,
      is_active: true,
      start_date: { [db.Sequelize.Op.lte]: new Date() },
      end_date: { [db.Sequelize.Op.gte]: new Date() }
    }
  });

  if (!promotion) return totalPrice;

  const discountAmount = (totalPrice * promotion.discount_percent) / 100;
  return totalPrice - discountAmount;
}

exports.createFromCart = async (req, res) => {
  const userId = req.userId;
  const { payment_method, promotion_id } = req.body;

  const t = await db.sequelize.transaction();

  try {
    console.log("🔍 Bắt đầu tìm giỏ hàng...");

    // Lấy giỏ hàng của người dùng
    const cart = await Cart.findOne({
      where: { user_id: userId }
    });

    if (!cart) {
      console.log("⚠️ Không tìm thấy giỏ hàng.");
      return res.status(404).send({ message: "Không tìm thấy giỏ hàng!" });
    }

    // Lấy danh sách sản phẩm trong giỏ hàng
    const cartItems = await CartItem.findAll({
      where: { cart_id: cart.cart_id },
      include: [Product]
    });

    if (!cartItems || cartItems.length === 0) {
      console.log("⚠️ Giỏ hàng trống.");
      return res.status(400).send({ message: "Giỏ hàng trống!" });
    }

    console.log("✅ Đã lấy giỏ hàng. Bắt đầu tính tổng tiền...");
    let totalPrice = 0;
    const orderDetails = [];

    for (const item of cartItems) {
      const subtotal = item.product.price * item.quantity;
      totalPrice += subtotal;

      orderDetails.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.product.price
      });
    }

    console.log("📝 Tổng tiền trước giảm giá:", totalPrice);

    // Áp dụng mã giảm giá nếu có
    const finalPrice = await applyPromotion(totalPrice, promotion_id);
    console.log("📝 Tổng tiền sau giảm giá:", finalPrice);

    // Tạo đơn hàng
    console.log("🚀 Tạo đơn hàng...");
    const order = await Order.create({
      user_id: userId,
      total_price: finalPrice,
      status: 'Chờ xác nhận',
      promotion_id: promotion_id
    }, { transaction: t });

    // Tạo chi tiết đơn hàng
    console.log("🛒 Tạo chi tiết đơn hàng...");
    for (const detail of orderDetails) {
      await OrderDetail.create({
        order_id: order.order_id,
        ...detail
      }, { transaction: t });
    }

    // Lịch sử trạng thái
    await OrderStatusHistory.create({
      order_id: order.order_id,
      status: 'Chờ xác nhận'
    }, { transaction: t });

    // Thanh toán
    await Payment.create({
      order_id: order.order_id,
      method: payment_method,
      status: "Chờ thanh toán"
    }, { transaction: t });

    // Xóa giỏ hàng
    console.log("🧹 Xóa giỏ hàng...");
    await CartItem.destroy({
      where: { cart_id: cart.cart_id },
      transaction: t
    });

    await t.commit();
    console.log("✅ Transaction hoàn tất.");

    // Trả về đơn hàng mới
    const newOrder = await Order.findByPk(order.order_id, {
      include: [
        {
          model: OrderDetail,
          include: [Product]
        },
        User,
        Payment,
        {
          model: Promotion,
          attributes: ['title', 'discount_percent', 'description']
        }
      ]
    });

    res.status(201).send(newOrder);
  } catch (error) {
    await t.rollback();
    console.error("❌ Lỗi tạo đơn hàng:", error);
    res.status(500).send({ message: error.message || "Đã xảy ra lỗi khi tạo đơn hàng." });
  }
};

// Lấy tất cả đơn hàng (phân quyền)
exports.getAllOrders = async (req, res) => {
    try {
        const { page = 1, size = 10, status } = req.query; // Thêm status vào query params
        const limit = parseInt(size);
        const offset = (parseInt(page) - 1) * limit;

        let where = {};

        // Nếu là người dùng, chỉ lấy đơn hàng của họ
        if (req.userType === 'user') {
            where.user_id = req.userId;
        }

        // Thêm điều kiện lọc theo trạng thái nếu có
        if (status && status !== 'all') {
            where.status = status;
        }

        // Lấy danh sách đơn hàng từ cơ sở dữ liệu
        const { count, rows } = await Order.findAndCountAll({
            where,
            include: [
                { model: User, attributes: ['name', 'email', 'phone'] },
                {
                    model: OrderDetail,
                    include: [{ model: Product, attributes: ['name', 'price', 'image_url'] }]
                },
                Payment
            ],
            order: [['order_time', 'DESC']],
            limit,
            offset
        });

        // Tính tổng số trang
        const totalPages = Math.ceil(count / limit);

        // Trả về dữ liệu phân trang
        res.send({
            totalItems: count,
            totalPages,
            currentPage: parseInt(page),
            orders: rows
        });
    } catch (error) {
        console.error("❌ Lỗi khi lấy danh sách đơn hàng:", error);
        res.status(500).send({ message: error.message });
    }
};

// Xem chi tiết đơn hàng
exports.getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;

        // Tìm đơn hàng theo ID
        const order = await Order.findByPk(orderId, {
            include: [
                { model: User, attributes: ['name', 'email', 'phone', 'address'] },
                {
                    model: OrderDetail,
                    include: [{ model: Product, attributes: ['name', 'price', 'image_url'] }]
                },
                Payment
            ]
        });

        // Kiểm tra nếu đơn hàng không tồn tại
        if (!order) {
            return res.status(404).send({ message: "Đơn hàng không tồn tại!" });
        }

        // Kiểm tra quyền truy cập
        if (req.userType === 'user' && order.user_id !== req.userId) {
            return res.status(403).send({ message: "Không có quyền truy cập đơn hàng này!" });
        }

        // Trả về chi tiết đơn hàng
        res.send(order);
    } catch (error) {
        console.error("❌ Lỗi khi lấy chi tiết đơn hàng:", error);
        res.status(500).send({ message: error.message });
    }
};

// Cập nhật trạng thái đơn hàng và thanh toán (chỉ nhân viên)
exports.updateOrderStatus = async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body; // Nhận trạng thái từ client
    const staffId = req.staffId;

    if (!status) {
        return res.status(400).send({ message: "Trạng thái không được để trống!" });
    }

    const t = await db.sequelize.transaction();

    try {
        const order = await Order.findByPk(orderId);
        if (!order) {
            return res.status(404).send({ message: "Đơn hàng không tồn tại!" });
        }

        // Cập nhật trạng thái đơn hàng
        await Order.update(
            { status, staff_id: staffId },
            { where: { order_id: orderId }, transaction: t }
        );

        // Thêm lịch sử trạng thái
        await OrderStatusHistory.create(
            { order_id: orderId, status, staff_id: staffId },
            { transaction: t }
        );

        // Nếu trạng thái là "Đã giao", cập nhật thanh toán thành "Đã thanh toán"
        if (status === 'Đã giao') {
            await Payment.update(
                { status: "Đã thanh toán", paid_at: new Date() },
                { where: { order_id: orderId }, transaction: t }
            );
        }

        await t.commit();

        // Lấy đơn hàng đã cập nhật
        const updatedOrder = await Order.findByPk(orderId, {
            include: [
                { model: User, attributes: ['name'] },
                { model: OrderDetail, include: [Product] },
                Payment
            ]
        });

        res.send(updatedOrder);
    } catch (error) {
        await t.rollback();
        console.error("❌ Lỗi khi cập nhật trạng thái đơn hàng:", error);
        res.status(500).send({ message: error.message });
    }
};

// Hủy đơn hàng
exports.cancelOrder = async (req, res) => {
    const orderId = req.params.id;
    const t = await db.sequelize.transaction();

    try {
        const order = await Order.findByPk(orderId);

        if (!order) {
            return res.status(404).send({ message: "Đơn hàng không tồn tại!" });
        }

        // Kiểm tra quyền hủy đơn
        if (req.userType === 'user' && order.user_id !== req.userId) {
            return res.status(403).send({ message: "Không có quyền hủy đơn hàng này!" });
        }

        // Kiểm tra nếu đơn hàng đã giao hoặc hoàn thành thì không thể hủy
        if (['Đã giao', 'Đã hoàn thành'].includes(order.status)) {
            return res.status(400).send({ message: "Không thể hủy đơn hàng đã giao hoặc đã hoàn thành" });
        }

        // Cập nhật trạng thái
        await Order.update(
            { status: 'Đã hủy' },
            { where: { order_id: orderId }, transaction: t }
        );

        // Thêm lịch sử
        await OrderStatusHistory.create(
            { order_id: orderId, status: 'Đã hủy', staff_id: req.staffId || null },
            { transaction: t }
        );

        // Cập nhật thanh toán
        await Payment.update(
            { status: "Đã hủy" },
            { where: { order_id: orderId }, transaction: t }
        );

        await t.commit();

        res.send({ message: "Đơn hàng đã được hủy thành công" });
    } catch (error) {
        await t.rollback();
        console.error("❌ Lỗi khi hủy đơn hàng:", error);
        res.status(500).send({ message: error.message });
    }
};

// Tạo đơn hàng trực tiếp không qua giỏ hàng
exports.createDirectOrder = async (req, res) => {
  const userId = req.userId;
  const { product_id, quantity, payment_method, promotion_id } = req.body;

  const t = await db.sequelize.transaction();

  try {
    console.log("🔍 Bắt đầu xử lý mua hàng trực tiếp...");

    // Kiểm tra thông tin sản phẩm và số lượng
    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).send({ message: "Thông tin sản phẩm hoặc số lượng không hợp lệ!" });
    }

    // Lấy thông tin sản phẩm từ cơ sở dữ liệu
    const product = await Product.findByPk(product_id);

    if (!product) {
      return res.status(404).send({ message: `Sản phẩm với ID ${product_id} không tồn tại!` });
    }

    // Tính tổng tiền
    const totalPrice = product.price * quantity;
    console.log("📝 Tổng tiền trước giảm giá:", totalPrice);

    // Áp dụng mã giảm giá nếu có
    const finalPrice = await applyPromotion(totalPrice, promotion_id);
    console.log("📝 Tổng tiền sau giảm giá:", finalPrice);

    // Tạo đơn hàng
    console.log("🚀 Tạo đơn hàng...");
    const order = await Order.create(
      {
        user_id: userId,
        total_price: finalPrice,
        status: "Chờ xác nhận",
        promotion_id: promotion_id
      },
      { transaction: t }
    );

    // Tạo chi tiết đơn hàng
    console.log("🛒 Tạo chi tiết đơn hàng...");
    await OrderDetail.create(
      {
        order_id: order.order_id,
        product_id: product.product_id,
        quantity: quantity,
        unit_price: product.price,
      },
      { transaction: t }
    );

    // Lịch sử trạng thái
    await OrderStatusHistory.create(
      {
        order_id: order.order_id,
        status: "Chờ xác nhận",
      },
      { transaction: t }
    );

    // Thanh toán
    await Payment.create(
      {
        order_id: order.order_id,
        method: payment_method,
        status: "Chờ thanh toán",
      },
      { transaction: t }
    );

    await t.commit();
    console.log("✅ Transaction hoàn tất.");

    // Trả về đơn hàng mới
    const newOrder = await Order.findByPk(order.order_id, {
      include: [
        {
          model: OrderDetail,
          include: [Product]
        },
        User,
        Payment,
        {
          model: Promotion,
          attributes: ['title', 'discount_percent', 'description']
        }
      ]
    });

    res.status(201).send(newOrder);
  } catch (error) {
    await t.rollback();
    console.error("❌ Lỗi tạo đơn hàng trực tiếp:", error);
    res.status(500).send({ message: error.message || "Đã xảy ra lỗi khi tạo đơn hàng trực tiếp." });
  }
};