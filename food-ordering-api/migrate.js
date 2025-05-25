const db = require("./models");
const path = require("path");
const fs = require("fs");

async function runMigration() {
  try {
    const queryInterface = db.sequelize.getQueryInterface();
    const Sequelize = db.Sequelize;

    // Đọc và thực thi migration
    const migrationPath = path.join(__dirname, 'migrations', '20240320_add_promotion_to_orders.js');
    const migration = require(migrationPath);

    console.log('Đang chạy migration...');
    await migration.up(queryInterface, Sequelize);
    console.log('Migration đã hoàn tất thành công!');

    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi chạy migration:', error);
    process.exit(1);
  }
}

runMigration(); 