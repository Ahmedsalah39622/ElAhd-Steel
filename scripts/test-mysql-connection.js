/**
 * Test MySQL Database Connection
 * Tests connection to cPanel MySQL database
 */

require('dotenv').config()
const mysql = require('mysql2/promise')

async function testConnection() {
  console.log('🔄 Testing MySQL Database Connection...\n')

  // Parse DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env file')
    process.exit(1)
  }

  console.log('📋 Connection Details:')

  // Parse the URL (mysql://user:pass@host:port/database)
  const url = new URL(databaseUrl)

  const config = {
    host: url.hostname,
    port: url.port || 3306,
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1) // Remove leading /
  }

  console.log(`   Host: ${config.host}`)
  console.log(`   Port: ${config.port}`)
  console.log(`   User: ${config.user}`)
  console.log(`   Database: ${config.database}`)
  console.log(`   Password: ${'*'.repeat(config.password.length)}\n`)

  let connection

  try {
    // Attempt connection
    console.log('🔌 Connecting to MySQL server...')
    connection = await mysql.createConnection(config)

    console.log('✅ Connected successfully!\n')

    // Test query
    console.log('📊 Running test query...')
    const [rows] = await connection.execute('SELECT 1 + 1 AS result')

    console.log(`   Query result: ${rows[0].result}`)

    // Get server info
    const [versionRows] = await connection.execute('SELECT VERSION() as version')

    console.log(`   MySQL Version: ${versionRows[0].version}`)

    // List tables
    console.log('\n📁 Checking existing tables...')
    const [tables] = await connection.execute('SHOW TABLES')

    if (tables.length === 0) {
      console.log('   No tables found (empty database)')
    } else {
      console.log(`   Found ${tables.length} table(s):`)
      tables.forEach(table => {
        const tableName = Object.values(table)[0]

        console.log(`   - ${tableName}`)
      })
    }

    console.log('\n✅ Database connection test PASSED!')
  } catch (error) {
    console.error('\n❌ Connection FAILED!')
    console.error(`   Error Code: ${error.code}`)
    console.error(`   Error Message: ${error.message}`)

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Tip: The database host "localhost" only works when running on the cPanel server.')
      console.log('   For remote access, you need to:')
      console.log('   1. Enable "Remote MySQL" in cPanel')
      console.log('   2. Add your IP address to the allowed hosts')
      console.log('   3. Change the host from "localhost" to "orca-steel.com" or the server IP')
    }

    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Tip: Check your username and password in cPanel MySQL Users')
    }

    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('\n🔌 Connection closed.')
    }
  }
}

testConnection()
