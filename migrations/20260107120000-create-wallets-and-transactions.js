'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    // Wallets table (one wallet per user by default)
    await queryInterface.createTable('wallets', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      ownerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: { type: Sequelize.STRING, allowNull: false, defaultValue: 'Personal Wallet' },
      balance: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    })

    // Wallet transactions (audit trail)
    await queryInterface.createTable('wallet_transactions', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      walletId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'wallets', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: { type: Sequelize.STRING, allowNull: false }, // deposit, withdraw, transfer
      amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      relatedSafeId: { type: Sequelize.INTEGER, allowNull: true },
      relatedWalletId: { type: Sequelize.INTEGER, allowNull: true },
      txRef: { type: Sequelize.STRING, allowNull: true },
      initiatedBy: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    })

    // Ensure a wallet exists for each user (optional) - skip automatic seeding here
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('wallet_transactions')
    await queryInterface.dropTable('wallets')
  }
}
