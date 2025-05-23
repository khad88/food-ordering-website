// models/product.model.js
module.exports = (sequelize, Sequelize) => {
    const Product = sequelize.define("products", {
      product_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(100)
      },
      description: {
        type: Sequelize.TEXT
      },
      price: {
        type: Sequelize.DECIMAL(10, 2)
      },
      image_url: {
        type: Sequelize.STRING(255)
      },
      category_id: {
        type: Sequelize.INTEGER
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      }
    }, {
      timestamps: false
    });
  
    return Product;
  };