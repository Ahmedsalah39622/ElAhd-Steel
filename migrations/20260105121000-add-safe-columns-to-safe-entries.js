'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add columns to link safe entries to safes and support transfers
    const table = await queryInterface.describeTable('safe_entries')

    if (!table.safeId) {
      await queryInterface.addColumn('safe_entries', 'safeId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'safes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      })
    }

    if (!table.targetSafeId) {
      await queryInterface.addColumn('safe_entries', 'targetSafeId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'safes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      })
    }

    if (!table.entryType) {
      await queryInterface.addColumn('safe_entries', 'entryType', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'incoming'
      })
    }

    // Set existing entries to Main Safe
    const [results] = await queryInterface.sequelize.query("SELECT id FROM safes WHERE name = 'Main Safe' LIMIT 1")
    if (results && results.length) {
      const mainId = results[0].id
      await queryInterface.sequelize.query(`UPDATE "safe_entries" SET "safeId" = ${mainId}`)
    }

    await queryInterface.addIndex('safe_entries', ['safeId'])
    await queryInterface.addIndex('safe_entries', ['targetSafeId'])
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('safe_entries', ['targetSafeId'])
    await queryInterface.removeIndex('safe_entries', ['safeId'])
    await queryInterface.removeColumn('safe_entries', 'entryType')
    await queryInterface.removeColumn('safe_entries', 'targetSafeId')
    await queryInterface.removeColumn('safe_entries', 'safeId')
  }
}
