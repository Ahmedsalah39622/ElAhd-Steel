const { Sequelize, DataTypes } = require('sequelize')
require('dotenv').config()

async function createClientAttachmentsTable() {
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: console.log
  })

  try {
    await sequelize.authenticate()
    console.log('Connected to database')

    // Create client_attachments table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS client_attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clientId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) DEFAULT 'general',
        fileName VARCHAR(255) NOT NULL,
        filePath VARCHAR(500) NOT NULL,
        fileSize INT,
        mimeType VARCHAR(100),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_clientId (clientId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    console.log('client_attachments table created successfully!')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await sequelize.close()
  }
}

createClientAttachmentsTable()
