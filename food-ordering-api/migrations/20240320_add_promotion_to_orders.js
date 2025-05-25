'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'promotion_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'promotions',
        key: 'promotion_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Tạo index cho promotion_id để tối ưu hiệu suất truy vấn
    await queryInterface.addIndex('orders', ['promotion_id'], {
      name: 'orders_promotion_id_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Xóa index trước
    await queryInterface.removeIndex('orders', 'orders_promotion_id_idx');
    
    // Sau đó xóa cột
    await queryInterface.removeColumn('orders', 'promotion_id');
  }
}; 