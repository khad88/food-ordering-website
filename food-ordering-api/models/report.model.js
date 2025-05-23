// models/report.model.js
module.exports = (sequelize, Sequelize) => {
  const Report = sequelize.define("report", {
    report_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    staff_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    report_date: {
      type: Sequelize.DATE,
      allowNull: false
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: false
    }
  }, {
    timestamps: false,
    tableName: 'reports'
  });

  return Report;
};