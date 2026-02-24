'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class InventoryTransaction extends Model {
    static associate(models) {
      InventoryTransaction.belongsTo(models.Material, { foreignKey: 'materialId' })
      InventoryTransaction.belongsTo(models.MaterialPiece, { foreignKey: 'materialPieceId' })
      // Add JobOrder association if model exists (dynamic check or hardcode if sure)
      if (models.JobOrder) {
          InventoryTransaction.belongsTo(models.JobOrder, { foreignKey: 'jobOrderId', as: 'jobOrder' })
      }
    }
  }

  InventoryTransaction.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      materialId: DataTypes.INTEGER,
      materialPieceId: DataTypes.INTEGER,
      change: DataTypes.DECIMAL(18, 2),
      action: DataTypes.STRING, // 'add' | 'remove'
      source: DataTypes.STRING, // 'factory' | 'client' or free text
      reference: DataTypes.STRING,
      user: DataTypes.STRING,
      user: DataTypes.STRING,
      user: DataTypes.STRING,
      note: DataTypes.TEXT,
      // status: { type: DataTypes.STRING, defaultValue: 'pending' }
    },
    {
      sequelize,
      modelName: 'InventoryTransaction',
      tableName: 'inventory_transactions',
      timestamps: true
    }
  )

  return InventoryTransaction
}
