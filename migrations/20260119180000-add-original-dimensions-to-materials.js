'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add originalLength column
    try {
      await queryInterface.addColumn('materials', 'originalLength', {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      })
    } catch (e) {
      console.log('Column originalLength might already exist', e.message)
    }
    
    // Add originalWidth column
    try {
      await queryInterface.addColumn('materials', 'originalWidth', {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      })
    } catch (e) {
       console.log('Column originalWidth might already exist', e.message)
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('materials', 'originalLength')
    await queryInterface.removeColumn('materials', 'originalWidth')
  }
}
