module.exports = (sequelize, DataTypes) => {
  const PurchaseOrder = sequelize.define(
    'PurchaseOrder',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      orderNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      supplierId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'suppliers',
          key: 'id'
        }
      },
      materialId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'materials',
          key: 'id'
        }
      },
      weight: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      recipient: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'المستودع'
      },
      paymentMethod: {
        type: DataTypes.STRING,
        defaultValue: 'cash'
      },
      transactionNumber: {
        type: DataTypes.STRING,
        allowNull: true
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
        defaultValue: 'pending'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      paymentStatus: {
        type: DataTypes.ENUM('paid', 'credit', 'partial'),
        defaultValue: 'paid'
      },
      paidAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: 'purchase_orders',
      timestamps: true
    }
  )

  PurchaseOrder.associate = db => {
    PurchaseOrder.belongsTo(db.Supplier, {
      foreignKey: 'supplierId',
      as: 'supplier'
    })
    PurchaseOrder.belongsTo(db.Material, {
      foreignKey: 'materialId',
      as: 'material'
    })
  }

  return PurchaseOrder
}
