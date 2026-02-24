'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('materials', 'dimensionType', {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: 'rectangular'
    })
    
    // Also add thickness field for pipes/tubes
    await queryInterface.addColumn('materials', 'thickness', {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('materials', 'dimensionType')
    await queryInterface.removeColumn('materials', 'thickness')
  }
}
