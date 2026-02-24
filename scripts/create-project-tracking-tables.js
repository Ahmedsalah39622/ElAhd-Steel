// Script to create enhanced project tables for comprehensive project tracking
const mysql = require('mysql2/promise')

async function createProjectTables() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL)

  console.log('Connected to database...')

  try {
    // 1. Add projectId column to invoices table
    console.log('Adding projectId to invoices...')

    try {
      await connection.query(`ALTER TABLE invoices ADD COLUMN projectId INT NULL`)
      await connection.query(`ALTER TABLE invoices ADD INDEX idx_projectId (projectId)`)
      console.log('✓ Added projectId to invoices')
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('→ projectId already exists in invoices')
      } else {
        console.error('Error with invoices:', e.message)
      }
    }

    // 2. Create project_activities table (Activity Log / Black Box)
    console.log('Creating project_activities table...')
    const [activityTables] = await connection.query(`SHOW TABLES LIKE 'project_activities'`)

    if (activityTables.length === 0) {
      await connection.query(`
        CREATE TABLE project_activities (
          id INT AUTO_INCREMENT PRIMARY KEY,
          projectId INT NOT NULL,
          activityType VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NULL,
          metadata TEXT NULL,
          createdBy VARCHAR(255) NULL,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_projectId (projectId),
          INDEX idx_activityType (activityType),
          INDEX idx_createdAt (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      console.log('✓ Created project_activities table')
    } else {
      console.log('→ project_activities already exists')
    }

    // 3. Create project_materials table (Materials used in project)
    console.log('Creating project_materials table...')
    const [materialTables] = await connection.query(`SHOW TABLES LIKE 'project_materials'`)

    if (materialTables.length === 0) {
      await connection.query(`
        CREATE TABLE project_materials (
          id INT AUTO_INCREMENT PRIMARY KEY,
          projectId INT NOT NULL,
          materialId INT NULL,
          materialName VARCHAR(255) NOT NULL,
          materialType VARCHAR(100) NULL,
          quantity DECIMAL(18, 3) NOT NULL DEFAULT 0,
          unit VARCHAR(50) NULL,
          unitCost DECIMAL(18, 2) NULL,
          totalCost DECIMAL(18, 2) NULL,
          status VARCHAR(50) DEFAULT 'pending',
          notes TEXT NULL,
          addedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          usedAt DATETIME NULL,
          INDEX idx_projectId (projectId),
          INDEX idx_materialId (materialId),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      console.log('✓ Created project_materials table')
    } else {
      console.log('→ project_materials already exists')
    }

    // 4. Create project_phases table (Milestones/Phases)
    console.log('Creating project_phases table...')
    const [phaseTables] = await connection.query(`SHOW TABLES LIKE 'project_phases'`)

    if (phaseTables.length === 0) {
      await connection.query(`
        CREATE TABLE project_phases (
          id INT AUTO_INCREMENT PRIMARY KEY,
          projectId INT NOT NULL,
          phaseName VARCHAR(255) NOT NULL,
          phaseOrder INT NOT NULL DEFAULT 0,
          description TEXT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          startDate DATETIME NULL,
          endDate DATETIME NULL,
          completedAt DATETIME NULL,
          notes TEXT NULL,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_projectId (projectId),
          INDEX idx_status (status),
          INDEX idx_phaseOrder (phaseOrder)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      console.log('✓ Created project_phases table')
    } else {
      console.log('→ project_phases already exists')
    }

    // 5. Create project_payments table (Payment tracking)
    console.log('Creating project_payments table...')
    const [paymentTables] = await connection.query(`SHOW TABLES LIKE 'project_payments'`)

    if (paymentTables.length === 0) {
      await connection.query(`
        CREATE TABLE project_payments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          projectId INT NOT NULL,
          invoiceId INT NULL,
          amount DECIMAL(18, 2) NOT NULL,
          paymentMethod VARCHAR(50) NULL,
          paymentType VARCHAR(50) DEFAULT 'incoming',
          reference VARCHAR(255) NULL,
          bankName VARCHAR(255) NULL,
          transactionNumber VARCHAR(255) NULL,
          notes TEXT NULL,
          paidAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_projectId (projectId),
          INDEX idx_invoiceId (invoiceId),
          INDEX idx_paymentType (paymentType),
          INDEX idx_paidAt (paidAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      console.log('✓ Created project_payments table')
    } else {
      console.log('→ project_payments already exists')
    }

    // 6. Create project_manufacturing table (Factory process logs)
    console.log('Creating project_manufacturing table...')
    const [mfgTables] = await connection.query(`SHOW TABLES LIKE 'project_manufacturing'`)

    if (mfgTables.length === 0) {
      await connection.query(`
        CREATE TABLE project_manufacturing (
          id INT AUTO_INCREMENT PRIMARY KEY,
          projectId INT NOT NULL,
          processName VARCHAR(255) NOT NULL,
          processType VARCHAR(100) NULL,
          description TEXT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          workerId INT NULL,
          workerName VARCHAR(255) NULL,
          machineUsed VARCHAR(255) NULL,
          startTime DATETIME NULL,
          endTime DATETIME NULL,
          duration INT NULL,
          quantity DECIMAL(18, 3) NULL,
          unit VARCHAR(50) NULL,
          notes TEXT NULL,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_projectId (projectId),
          INDEX idx_status (status),
          INDEX idx_workerId (workerId),
          INDEX idx_processType (processType)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      console.log('✓ Created project_manufacturing table')
    } else {
      console.log('→ project_manufacturing already exists')
    }

    // 7. Add more fields to projects table if needed
    console.log('Updating projects table with additional fields...')

    try {
      await connection.query(`ALTER TABLE projects ADD COLUMN priority VARCHAR(20) DEFAULT 'normal'`)
      console.log('✓ Added priority field')
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('→ priority already exists')
    }

    try {
      await connection.query(`ALTER TABLE projects ADD COLUMN projectNumber VARCHAR(50) NULL`)
      console.log('✓ Added projectNumber field')
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('→ projectNumber already exists')
    }

    try {
      await connection.query(`ALTER TABLE projects ADD COLUMN expectedDeliveryDate DATETIME NULL`)
      console.log('✓ Added expectedDeliveryDate field')
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('→ expectedDeliveryDate already exists')
    }

    try {
      await connection.query(`ALTER TABLE projects ADD COLUMN actualDeliveryDate DATETIME NULL`)
      console.log('✓ Added actualDeliveryDate field')
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('→ actualDeliveryDate already exists')
    }

    try {
      await connection.query(`ALTER TABLE projects ADD COLUMN progressPercent INT DEFAULT 0`)
      console.log('✓ Added progressPercent field')
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('→ progressPercent already exists')
    }

    console.log('\n✅ All project tables created/updated successfully!')
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await connection.end()
    console.log('Connection closed.')
  }
}

createProjectTables()
