// models/order_detail.model.js
module.exports = (sequelize, Sequelize) => {
  const OrderDetail = sequelize.define("order_details", {
    order_detail_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    order_id: {
      type: Sequelize.INTEGER
    },
    product_id: {
      type: Sequelize.INTEGER
    },
    quantity: {
      type: Sequelize.INTEGER
    },
    unit_price: {
      type: Sequelize.DECIMAL(10, 2)
    }
  }, {
    timestamps: false
  });

  return OrderDetail;
};