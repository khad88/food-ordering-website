// models/order.model.js
module.exports = (sequelize, Sequelize) => {
    const Order = sequelize.define("orders", {
      order_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER
      },
      staff_id: {
        type: Sequelize.INTEGER
      },
      total_price: {
        type: Sequelize.DECIMAL(10, 2)
      },
      status: {
        type: Sequelize.ENUM('Chờ xác nhận', 'Đang giao', 'Đã giao', 'Đã hủy', 'Đang xử lý', 'Đã hoàn thành'),
        defaultValue: 'Chờ xác nhận'
      },
      order_time: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, {
      timestamps: false
    });
  
    return Order;
  };