// models/product_promotion.model.js
module.exports = (sequelize, Sequelize) => {
  const ProductPromotion = sequelize.define("product_promotions", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    product_id: {
      type: Sequelize.INTEGER
    },
    promotion_id: {
      type: Sequelize.INTEGER
    }
  }, {
    timestamps: false
  });

  return ProductPromotion;
};