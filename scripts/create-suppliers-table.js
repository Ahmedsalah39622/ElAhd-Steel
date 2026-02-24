const mysql = require('mysql2/promise')

require('dotenv').config()

;(async () => {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255),
        phone VARCHAR(255),
        address TEXT,
        city VARCHAR(255),
        country VARCHAR(255),
        bankName VARCHAR(255),
        accountNumber VARCHAR(255),
        iban VARCHAR(255),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    console.log('✅ Suppliers table created successfully!')
    await connection.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating suppliers table:', error)
    process.exit(1)
  }
})()
