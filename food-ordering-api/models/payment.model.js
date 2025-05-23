// models/payment.model.js
  module.exports = (sequelize, Sequelize) => {
    const Payment = sequelize.define("payments", {
      payment_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      order_id: {
        type: Sequelize.INTEGER
      },
      method: {
        type: Sequelize.STRING(50)
      },
      status: {
        type: Sequelize.STRING(50)
      },
      paid_at: {
        type: Sequelize.DATE
      }
    }, {
      timestamps: false
    });
  
    return Payment;
  };