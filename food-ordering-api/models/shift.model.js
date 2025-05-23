// models/shift.model.js
module.exports = (sequelize, Sequelize) => {
  const Shift = sequelize.define("shift", {
    shift_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    start_time: {
      type: Sequelize.DATE,
      allowNull: false
    },
    end_time: {
      type: Sequelize.DATE,
      allowNull: false
    }
  }, {
    timestamps: false,
    tableName: 'shifts'
  });

  return Shift;
};