'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('safes')

    if (!table.ownerId) {
      await queryInterface.addColumn('safes', 'ownerId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      })
    }

    // If there are safes named 'Personal Safe' without owner, leave null — we'll set owner when created by user flow
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('safes')
    if (table.ownerId) await queryInterface.removeColumn('safes', 'ownerId')
  }
}
