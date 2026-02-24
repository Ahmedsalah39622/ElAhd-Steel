import { withAuth } from '@/utils/auth'

const { Sequelize } = require('sequelize')

const config = require('@/config')

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const env = process.env.NODE_ENV || 'development'
    const dbConfig = config[env]
    const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig)

    console.log('Checking materials table structure...')

    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'materials'
    `)

    const columns = results.map(r => r.column_name)
    const messages = []

    // Add count column if missing
    if (!columns.includes('count')) {
      console.log('Adding count column...')
      await sequelize.query(`
        ALTER TABLE materials 
        ADD COLUMN count INTEGER DEFAULT 0
      `)
      messages.push('✅ Added count column')
    } else {
      messages.push('⚠️  count column already exists')
    }

    // Add weight column if missing
    if (!columns.includes('weight')) {
      console.log('Adding weight column...')
      await sequelize.query(`
        ALTER TABLE materials 
        ADD COLUMN weight DECIMAL(18, 4) DEFAULT 0
      `)
      messages.push('✅ Added weight column')
    } else {
      messages.push('⚠️  weight column already exists')
    }

    await sequelize.close()

    return res.status(200).json({
      success: true,
      messages,
      note: 'Please restart the dev server for changes to take effect'
    })
  } catch (error) {
    console.error('Migration failed:', error)

    return res.status(500).json({ error: error.message })
  }
}

export default withAuth(handler)
