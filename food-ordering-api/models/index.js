// models/index.js
const config = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  config.DB,
  config.USER,
  config.PASSWORD,
  {
    host: config.HOST,
    dialect: config.dialect,
    operatorsAliases: false,
    pool: {
      max: config.pool.max,
      min: config.pool.min,
      acquire: config.pool.acquire,
      idle: config.pool.idle
    }
  }
);

sequelize.authenticate()
  .then(() => {
    console.log("Kết nối cơ sở dữ liệu thành công!");
  })
  .catch((err) => {
    console.error("Không thể kết nối cơ sở dữ liệu:", err);
  });

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import các models
db.users = require("./user.model.js")(sequelize, Sequelize);
db.staffs = require("./staff.model.js")(sequelize, Sequelize);
db.categories = require("./category.model.js")(sequelize, Sequelize);
db.products = require("./product.model.js")(sequelize, Sequelize);
db.orders = require("./order.model.js")(sequelize, Sequelize);
db.orderDetails = require("./order_detail.model.js")(sequelize, Sequelize);
db.orderStatusHistory = require("./order_status_history.model.js")(sequelize, Sequelize);
db.promotions = require("./promotion.model.js")(sequelize, Sequelize);
db.productPromotions = require("./product_promotion.model.js")(sequelize, Sequelize);
db.carts = require("./cart.model.js")(sequelize, Sequelize);
db.cartItems = require("./cart_item.model.js")(sequelize, Sequelize);
db.reviews = require("./review.model.js")(sequelize, Sequelize);
db.payments = require("./payment.model.js")(sequelize, Sequelize);
db.shift = require("./shift.model.js")(sequelize, Sequelize);
db.shift_assignment = require("./shift_assignment.model.js")(sequelize, Sequelize);
db.report = require("./report.model.js")(sequelize, Sequelize);

// Thiết lập mối quan hệ giữa các tables

// User - Order
db.users.hasMany(db.orders, { foreignKey: 'user_id' });
db.orders.belongsTo(db.users, { foreignKey: 'user_id' });

// Staff - Order
db.staffs.hasMany(db.orders, { foreignKey: 'staff_id' });
db.orders.belongsTo(db.staffs, { foreignKey: 'staff_id' });

// Category - Product
db.categories.hasMany(db.products, { foreignKey: 'category_id' });
db.products.belongsTo(db.categories, { foreignKey: 'category_id' });

// Order - OrderDetail
db.orders.hasMany(db.orderDetails, { foreignKey: 'order_id' });
db.orderDetails.belongsTo(db.orders, { foreignKey: 'order_id' });


// Product - OrderDetail
db.products.hasMany(db.orderDetails, { foreignKey: 'product_id' });
db.orderDetails.belongsTo(db.products, { foreignKey: 'product_id' });

// Order - OrderStatusHistory
db.orders.hasMany(db.orderStatusHistory, { foreignKey: 'order_id' });
db.orderStatusHistory.belongsTo(db.orders, { foreignKey: 'order_id' });

// Staff - OrderStatusHistory
db.staffs.hasMany(db.orderStatusHistory, { foreignKey: 'staff_id' });
db.orderStatusHistory.belongsTo(db.staffs, { foreignKey: 'staff_id' });

// Product - ProductPromotion
db.products.belongsToMany(db.promotions, {
  through: db.productPromotions,
  foreignKey: 'product_id',
  otherKey: 'promotion_id'
});

// Promotion - ProductPromotion
db.promotions.belongsToMany(db.products, {
  through: db.productPromotions,
  foreignKey: 'promotion_id',
  otherKey: 'product_id'
});


// User - Cart
db.users.hasOne(db.carts, { foreignKey: 'user_id' });
db.carts.belongsTo(db.users, { foreignKey: 'user_id' });

// Cart - CartItem
db.carts.hasMany(db.cartItems, { foreignKey: 'cart_id' });
db.cartItems.belongsTo(db.carts, { foreignKey: 'cart_id' });

// Product - CartItem
db.products.hasMany(db.cartItems, { foreignKey: 'product_id' });
db.cartItems.belongsTo(db.products, { foreignKey: 'product_id' });

// User - Review
db.users.hasMany(db.reviews, { foreignKey: 'user_id' });
db.reviews.belongsTo(db.users, { foreignKey: 'user_id' });

// Product - Review
db.products.hasMany(db.reviews, { foreignKey: 'product_id' });
db.reviews.belongsTo(db.products, { foreignKey: 'product_id' });

// Order - Payment
db.orders.hasMany(db.payments, { foreignKey: 'order_id' });
db.payments.belongsTo(db.orders, { foreignKey: 'order_id' });

// Staff - Shift Assignment
db.staffs.hasMany(db.shift_assignment, { foreignKey: 'staff_id', as: 'assignments' });
db.shift_assignment.belongsTo(db.staffs, { foreignKey: 'staff_id', as: 'staff' });

// Shift - Shift Assignment
db.shift.hasMany(db.shift_assignment, { foreignKey: 'shift_id', as: 'assignments' });
db.shift_assignment.belongsTo(db.shift, { foreignKey: 'shift_id', as: 'shift' });

// Staff - Report
db.staffs.hasMany(db.report, { foreignKey: 'staff_id', as: 'reports' });
db.report.belongsTo(db.staffs, { foreignKey: 'staff_id', as: 'staff' });

module.exports = db;