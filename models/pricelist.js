'use strict'

module.exports = (sequelize, DataTypes) => {
  const PriceList = sequelize.define(
    'PriceList',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'clientId'
      },
      clientName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'clientName'
      },
      projectName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'projectName'
      },
      projectDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'projectDescription'
      },
      items: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const rawValue = this.getDataValue('items')

          try {
            return rawValue ? JSON.parse(rawValue) : []
          } catch {
            return []
          }
        }
      },
      manufacturingItems: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'manufacturingItems',
        get() {
          const rawValue = this.getDataValue('manufacturingItems')

          try {
            return rawValue ? JSON.parse(rawValue) : []
          } catch {
            return []
          }
        }
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      validUntil: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'validUntil'
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'draft'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: 'price_lists',
      timestamps: true
    }
  )

  PriceList.associate = function (models) {
    if (models.Client) {
      PriceList.belongsTo(models.Client, {
        foreignKey: 'clientId',
        as: 'client'
      })
    }
  }

  return PriceList
}
