const db = require("../models");
const { Op } = require("sequelize");
const sequelize = db.sequelize;
const Order = db.orders;
const OrderDetail = db.orderDetails;
const Product = db.products;
const Category = db.categories;
const User = db.users;

// Lấy thống kê tổng quan
exports.getSummary = async (req, res) => {
  try {
    // Lấy tổng số đơn hàng
    const totalOrders = await Order.count();
    
    // Lấy tổng doanh thu
    const totalRevenue = await Order.sum('total_price', {
      where: {
        status: 'Đã hoàn thành'
      }
    });
    
    // Lấy số lượng người dùng
    const totalUsers = await User.count();
    
    // Lấy số lượng sản phẩm
    const totalProducts = await Product.count();
    
    // Lấy số đơn hàng trong ngày hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ordersToday = await Order.count({
      where: {
        order_time: {
          [Op.gte]: today
        }
      }
    });
    
    // Lấy doanh thu trong ngày hôm nay
    const revenueToday = await Order.sum('total_price', {
      where: {
        status: 'Đã hoàn thành',
        order_time: {
          [Op.gte]: today
        }
      }
    });
    
    res.status(200).send({
      totalOrders,
      totalRevenue: totalRevenue || 0,
      totalUsers,
      totalProducts,
      ordersToday,
      revenueToday: revenueToday || 0
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Đã xảy ra lỗi khi lấy thống kê tổng quan."
    });
  }
};

// Lấy thống kê doanh thu theo ngày
exports.getDailyRevenue = async (req, res) => {
  try {
    // Lấy dữ liệu từ 7 ngày gần nhất
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6); // 7 ngày gần nhất
    
    const result = await Order.findAll({
      where: {
        status: 'Đã hoàn thành',
        order_time: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('order_time')), 'date'],
        [sequelize.fn('SUM', sequelize.col('total_price')), 'revenue']
      ],
      group: [sequelize.fn('DATE', sequelize.col('order_time'))],
      order: [[sequelize.fn('DATE', sequelize.col('order_time')), 'ASC']]
    });
    
    // Tạo mảng đầy đủ 7 ngày, kể cả những ngày không có doanh thu
    const revenueByDay = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      const dayData = result.find(item => item.dataValues.date === dateStr);
      revenueByDay.push({
        date: dateStr,
        revenue: dayData ? parseFloat(dayData.dataValues.revenue) : 0
      });
    }
    
    res.status(200).send(revenueByDay);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Đã xảy ra lỗi khi lấy thống kê doanh thu theo ngày."
    });
  }
};

// Lấy thống kê doanh thu theo tháng
exports.getMonthlyRevenue = async (req, res) => {
  try {
    // Lấy dữ liệu từ 6 tháng gần nhất
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5); // 6 tháng gần nhất
    
    const result = await Order.findAll({
      where: {
        status: 'Đã hoàn thành',
        order_time: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('YEAR', sequelize.col('order_time')), 'year'],
        [sequelize.fn('MONTH', sequelize.col('order_time')), 'month'],
        [sequelize.fn('SUM', sequelize.col('total_price')), 'revenue']
      ],
      group: [
        sequelize.fn('YEAR', sequelize.col('order_time')),
        sequelize.fn('MONTH', sequelize.col('order_time'))
      ],
      order: [
        [sequelize.fn('YEAR', sequelize.col('order_time')), 'ASC'],
        [sequelize.fn('MONTH', sequelize.col('order_time')), 'ASC']
      ]
    });
    
    // Tạo mảng đầy đủ 6 tháng, kể cả những tháng không có doanh thu
    const revenueByMonth = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const monthData = result.find(item => 
        item.dataValues.year == year && item.dataValues.month == month
      );
      
      revenueByMonth.push({
        month: `${year}-${month.toString().padStart(2, '0')}`,
        revenue: monthData ? parseFloat(monthData.dataValues.revenue) : 0
      });
    }
    
    res.status(200).send(revenueByMonth);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Đã xảy ra lỗi khi lấy thống kê doanh thu theo tháng."
    });
  }
};

// Lấy thống kê top sản phẩm bán chạy
exports.getTopProducts = async (req, res) => {
  try {
    const limit = req.query.limit || 10; // Số lượng sản phẩm top muốn lấy
    
    const result = await OrderDetail.findAll({
      attributes: [
        'product_id',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
        [sequelize.fn('SUM', sequelize.literal('quantity * unit_price')), 'total_revenue']
      ],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['name', 'price', 'image_url']
      }],
      group: ['product_id'],
      order: [[sequelize.literal('total_quantity'), 'DESC']],
      limit: parseInt(limit)
    });
    
    res.status(200).send(result);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Đã xảy ra lỗi khi lấy top sản phẩm bán chạy."
    });
  }
};

// Lấy thống kê theo danh mục
exports.getCategoryPerformance = async (req, res) => {
  try {
    const result = await OrderDetail.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
        [sequelize.fn('SUM', sequelize.literal('quantity * unit_price')), 'total_revenue'],
        'product_id',  // Thêm product_id vào đây
        'product.category_id'  // Thêm category_id vào đây
      ],
      include: [{
        model: Product,
        as: 'product',
        attributes: [],
        include: [{
          model: Category,
          as: 'category',
          attributes: ['category_name']
        }]
      }],
      group: ['product_id', 'product.category_id'],  // Thêm product_id và category_id vào GROUP BY
      order: [[sequelize.literal('total_revenue'), 'DESC']]
    });
    
    res.status(200).send(result);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Đã xảy ra lỗi khi lấy thống kê theo danh mục."
    });
  }
};


// Lấy thống kê đơn hàng theo trạng thái
exports.getOrderStatusStats = async (req, res) => {
  try {
    const result = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('order_id')), 'count']
      ],
      group: ['status']
    });
    
    res.status(200).send(result);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Đã xảy ra lỗi khi lấy thống kê đơn hàng theo trạng thái."
    });
  }
};