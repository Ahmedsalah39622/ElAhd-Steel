'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class JobOrder extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // JobOrder can have many InventoryTransactions (Issue Orders)
      // We'll store jobOrderId in InventoryTransaction eventually, or just rely on note parsing for now
      // Let's add the association for future use
      JobOrder.hasMany(models.InventoryTransaction, { foreignKey: 'jobOrderId', as: 'transactions' })
    }
  }
  JobOrder.init({
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    clientName: DataTypes.STRING,
    projectCode: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    // Specifications: Diameter, Hardness, Total Length, Thread Length, Bending, Galvanization, Quantity...
    specifications: DataTypes.JSON, 
    // Calculations: Rods needed, Rods required from stock, Waste length, Total approximate weight, Weight per item
    calculations: DataTypes.JSON,
    // Accessories: Nuts count, Nuts weight, Washers count, etc.
    accessories: DataTypes.JSON,
    // Engineering Drawing: Base64 image or description
    engineeringDrawing: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'JobOrder',
  })
  return JobOrder
}
