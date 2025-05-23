// models/user.model.js
module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("users", {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(100)
      },
      email: {
        type: Sequelize.STRING(100),
        unique: true
      },
      password: {
        type: Sequelize.STRING(255)
      },
      phone: {
        type: Sequelize.STRING(20)
      },
      address: {
        type: Sequelize.TEXT
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, {
      timestamps: false
    });
  
    return User;
  };