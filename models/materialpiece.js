'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class MaterialPiece extends Model {
    static associate(models) {
      MaterialPiece.belongsTo(models.Material, { foreignKey: 'materialId' })
      MaterialPiece.hasMany(models.InventoryTransaction, { foreignKey: 'materialPieceId' })
      MaterialPiece.belongsTo(models.MaterialPiece, { foreignKey: 'parentPieceId', as: 'parentPiece' })
      // Link to Client for reserved pieces
      MaterialPiece.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' })
    }
  }

  MaterialPiece.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      materialId: { type: DataTypes.INTEGER, allowNull: false },
      length: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
      width: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
      quantity: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 1 },
      isLeftover: { type: DataTypes.BOOLEAN, defaultValue: false },
      parentPieceId: { type: DataTypes.INTEGER, allowNull: true },
      status: { type: DataTypes.STRING, defaultValue: 'available' },
      clientId: { type: DataTypes.INTEGER, allowNull: true } // Client who reserved this piece
    },
    {
      sequelize,
      modelName: 'MaterialPiece',
      tableName: 'material_pieces',
      timestamps: true
    }
  )

  return MaterialPiece
}
