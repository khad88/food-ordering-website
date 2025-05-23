// models/promotion.model.js
module.exports = (sequelize, Sequelize) => {
    const Promotion = sequelize.define("promotions", {
      promotion_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING(100)
      },
      description: {
        type: Sequelize.TEXT
      },
      discount_percent: {
        type: Sequelize.DECIMAL(5, 2)
      },
      start_date: {
        type: Sequelize.DATEONLY
      },
      end_date: {
        type: Sequelize.DATEONLY
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      }
    }, {
      timestamps: false
    });
  
    return Promotion;
  };
  