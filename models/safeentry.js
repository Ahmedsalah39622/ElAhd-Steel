// models/safeentry.js
'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class SafeEntry extends Model {
    static associate(models) {
      SafeEntry.belongsTo(models.Safe, { foreignKey: 'safeId', as: 'safe' })
      SafeEntry.belongsTo(models.Safe, { foreignKey: 'targetSafeId', as: 'targetSafe' })
      SafeEntry.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' })
      SafeEntry.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' })
    }
  }

  SafeEntry.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      month: DataTypes.STRING,
      date: DataTypes.DATE,
      description: DataTypes.TEXT,
      project: DataTypes.STRING,
      customer: DataTypes.STRING,
      incoming: DataTypes.DECIMAL(18, 2),
      outgoing: DataTypes.DECIMAL(18, 2),
      incomingMethod: DataTypes.STRING,
      outgoingMethod: DataTypes.STRING,
      incomingTxn: DataTypes.STRING,
      outgoingTxn: DataTypes.STRING,
      balance: DataTypes.DECIMAL(18, 2),
      // New fields for multi-safe support
      safeId: DataTypes.INTEGER,
      targetSafeId: DataTypes.INTEGER,
      clientId: DataTypes.INTEGER,
      supplierId: DataTypes.INTEGER,
      entryType: DataTypes.STRING // 'incoming' | 'outgoing' | 'transfer'
    },
    {
      sequelize,
      modelName: 'SafeEntry',
      tableName: 'safe_entries',
      timestamps: true
    }
  )

  return SafeEntry
}
