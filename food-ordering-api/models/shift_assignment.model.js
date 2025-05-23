// models/shift_assignment.model.js
module.exports = (sequelize, Sequelize) => {
  const ShiftAssignment = sequelize.define("shift_assignment", {
    assignment_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    shift_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    staff_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  }, {
    timestamps: false,
    tableName: 'shift_assignments'
  });

  return ShiftAssignment;
};