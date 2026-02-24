// Script to create the projects table in MySQL
const mysql = require('mysql2/promise')

async function createProjectsTable() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL)

  console.log('Connected to database...')

  try {
    // Check if table already exists
    const [tables] = await connection.query(`SHOW TABLES LIKE 'projects'`)

    if (tables.length > 0) {
      console.log('Table "projects" already exists!')

      return
    }

    // Create the projects table
    await connection.query(`
      CREATE TABLE projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        clientId INT NULL,
        clientName VARCHAR(255) NULL,
        description TEXT NULL,
        location VARCHAR(255) NULL,
        startDate DATETIME NULL,
        endDate DATETIME NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'completed',
        totalCost DECIMAL(18, 2) NULL,
        totalRevenue DECIMAL(18, 2) NULL,
        notes TEXT NULL,
        attachments TEXT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_clientId (clientId),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    console.log('Table "projects" created successfully!')
  } catch (error) {
    console.error('Error creating table:', error.message)
  } finally {
    await connection.end()
    console.log('Connection closed.')
  }
}

createProjectsTable()
