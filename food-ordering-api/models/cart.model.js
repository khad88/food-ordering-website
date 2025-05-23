// models/cart.model.js
module.exports = (sequelize, Sequelize) => {
    const Cart = sequelize.define("carts", {
      cart_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER
      }
    }, {
      timestamps: false
    });
  
    return Cart;
  };

  
  