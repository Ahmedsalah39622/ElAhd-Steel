import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  const { sequelize, Worker } = await initializeDatabase()

  if (req.method === 'GET') {
    try {
      const workers = await Worker.findAll({
        order: [['createdAt', 'DESC']]
      })

      res.status(200).json({
        success: true,
        data: workers,
        message: 'Workers retrieved successfully'
      })
    } catch (error) {
      console.error('Error fetching workers:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch workers',
        error: error.message
      })
    }
  } else if (req.method === 'POST') {
    try {
      const { name, email, phone, position, department, baseSalary, hireDate, status } = req.body

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Worker name is required'
        })
      }

      const worker = await Worker.create({
        name,
        email,
        phone,
        position,
        department,
        baseSalary,
        hireDate,
        status: status || 'active'
      })

      res.status(201).json({
        success: true,
        data: worker,
        message: 'Worker created successfully'
      })
    } catch (error) {
      console.error('Error creating worker:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to create worker',
        error: error.message
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

export default withAuth(handler)
