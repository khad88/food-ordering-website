// models/cart_item.model.js
module.exports = (sequelize, Sequelize) => {
    const CartItem = sequelize.define("cart_items", {
      cart_item_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      cart_id: {
        type: Sequelize.INTEGER
      },
      product_id: {
        type: Sequelize.INTEGER
      },
      quantity: {
        type: Sequelize.INTEGER
      }
    }, {
      timestamps: false
    });
  
    return CartItem;
};