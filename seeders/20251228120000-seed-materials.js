'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.bulkInsert(
        'materials',
        [
          {
            name: 'Test Factory Material A',
            sku: 'FAC-A-001',
            unit: 'pcs',
            type: 'factory',
            stock: 100,
            createdBy: 'seed',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            name: 'Test Factory Material B',
            sku: 'FAC-B-001',
            unit: 'kg',
            type: 'factory',
            stock: 50,
            createdBy: 'seed',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        {}
      )
    } catch (err) {
      // Log detailed error for debugging when running `npx sequelize-cli db:seed:all`
      try {
        console.error('Seeder 20251228120000-seed-materials.js failed - name:', err && err.name)
        console.error('Seeder 20251228120000-seed-materials.js failed - message:', err && err.message)
        console.error('Seeder 20251228120000-seed-materials.js failed - errors:', err && err.errors)
        console.error(
          'Seeder 20251228120000-seed-materials.js failed - full err:',
          JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
        )
        if (err && err.stack) console.error(err.stack)
      } catch (logErr) {
        console.error('Failed logging seeder error', logErr)
      }
      throw err
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('materials', { sku: ['FAC-A-001', 'FAC-B-001'] }, {})
  }
}
