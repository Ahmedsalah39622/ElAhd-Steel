'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Material extends Model {
    static associate(models) {
      Material.hasMany(models.InventoryTransaction, { foreignKey: 'materialId' })
      Material.hasMany(models.MaterialPiece, { foreignKey: 'materialId', as: 'pieces' })
    }
  }

  Material.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: DataTypes.STRING,
      sku: DataTypes.STRING,
      unit: DataTypes.STRING,
      type: DataTypes.STRING,
      stock: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
      createdBy: DataTypes.STRING,
      materialName: DataTypes.STRING,
      grade: DataTypes.STRING,
      image: DataTypes.STRING,
      // Original dimensions - NEVER change after creation, used as reference for cutting
      originalLength: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
      originalWidth: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
      // Dimension type: rectangular (uses width) or circular (uses diameter)
      dimensionType: { 
        type: DataTypes.STRING(20), 
        allowNull: true, 
        defaultValue: 'rectangular'
      },
      // Thickness for pipes/tubes (wall thickness)
      thickness: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
      // Dual-unit tracking: count (items) and weight (kg/g)
      count: { type: DataTypes.INTEGER, defaultValue: 0 },
      weight: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 }
    },
    {
      sequelize,
      modelName: 'Material',
      tableName: 'materials',
      timestamps: true
    }
  )

  Material.afterInit = () => {
    Material.hasMany(sequelize.models.PurchaseOrder, { foreignKey: 'materialId', as: 'purchaseOrders' })
  }

  return Material
}
