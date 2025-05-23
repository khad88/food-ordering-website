// models/staff.model.js
module.exports = (sequelize, Sequelize) => {
    const Staff = sequelize.define("staffs", {
      staff_id: {
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
      role: {
        type: Sequelize.ENUM('employee', 'manager'),
        allowNull: false
      },
      hire_date: {
        type: Sequelize.DATEONLY
      }
    }, {
      timestamps: false
    });
  
    return Staff;
  };