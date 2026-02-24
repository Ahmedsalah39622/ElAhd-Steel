module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define(
    'Client',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      profile: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      budget: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: true
      },
      material: {
        type: DataTypes.TEXT,
        allowNull: true
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
      tableName: 'clients',
      timestamps: true
    }
  )

  Client.associate = db => {
    Client.hasMany(db.SafeEntry, { foreignKey: 'clientId', as: 'safeEntries' })
    Client.hasMany(db.Invoice, { foreignKey: 'clientId', as: 'invoices' }) // Ensure this exists if not already
  }

  return Client
}
