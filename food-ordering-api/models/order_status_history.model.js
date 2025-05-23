module.exports = (sequelize, Sequelize) => {
  const OrderStatusHistory = sequelize.define("order_status_history", {
    history_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    order_id: {
      type: Sequelize.INTEGER
    },
    status: {
      type: Sequelize.ENUM('Chờ xác nhận', 'Đang giao', 'Đã giao', 'Đã hủy', 'Đang xử lý', 'Đã hoàn thành')
    },
    changed_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    staff_id: {
      type: Sequelize.INTEGER
    }
  }, {
    tableName: "order_status_history", // Đảm bảo tên bảng chính xác
    timestamps: false
  });

  return OrderStatusHistory;
};