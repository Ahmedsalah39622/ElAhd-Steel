'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Change column type to LONGTEXT to support Base64 images
    try {
        await queryInterface.changeColumn('JobOrders', 'engineeringDrawing', {
            type: Sequelize.TEXT('long'),
            allowNull: true
        });
    } catch (e) {
        console.error('Migration failed:', e);
        throw e;
    }
  },

  async down (queryInterface, Sequelize) {
    // Revert to TEXT
    await queryInterface.changeColumn('JobOrders', 'engineeringDrawing', {
        type: Sequelize.TEXT,
        allowNull: true
    });
  }
};
