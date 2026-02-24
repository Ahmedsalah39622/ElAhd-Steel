'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Wallet extends Model {
    static associate(models) {
      Wallet.belongsTo(models.User, { foreignKey: 'ownerId', as: 'owner' })
      Wallet.hasMany(models.WalletTransaction, { foreignKey: 'walletId', as: 'transactions' })
    }
  }

  Wallet.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      ownerId: DataTypes.INTEGER,
      name: DataTypes.STRING,
      balance: DataTypes.DECIMAL(18, 2),
      allowMainSafeWithdraw: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
    },
    {
      sequelize,
      modelName: 'Wallet',
      tableName: 'wallets',
      timestamps: true
    }
  )

  return Wallet
}
