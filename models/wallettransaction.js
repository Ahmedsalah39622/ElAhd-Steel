'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class WalletTransaction extends Model {
    static associate(models) {
      WalletTransaction.belongsTo(models.Wallet, { foreignKey: 'walletId', as: 'wallet' })
      WalletTransaction.belongsTo(models.User, { foreignKey: 'initiatedBy', as: 'initiator' })
    }
  }

  WalletTransaction.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      walletId: DataTypes.INTEGER,
      type: DataTypes.STRING,
      amount: DataTypes.DECIMAL(18, 2),
      description: DataTypes.TEXT,
      relatedSafeId: DataTypes.INTEGER,
      relatedWalletId: DataTypes.INTEGER,
      txRef: DataTypes.STRING,
      initiatedBy: DataTypes.INTEGER
    },
    {
      sequelize,
      modelName: 'WalletTransaction',
      tableName: 'wallet_transactions',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: false
    }
  )

  return WalletTransaction
}
