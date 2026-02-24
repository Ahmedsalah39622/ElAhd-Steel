import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  const { sequelize, Worker } = await initializeDatabase()
  const { id } = req.query

  if (req.method === 'PUT') {
    try {
      const worker = await Worker.findByPk(id)

      if (!worker) {
        return res.status(404).json({
          success: false,
          message: 'Worker not found'
        })
      }

      const { name, email, phone, position, department, baseSalary, hireDate, status } = req.body

      await worker.update({
        name: name || worker.name,
        email: email || worker.email,
        phone: phone || worker.phone,
        position: position || worker.position,
        department: department || worker.department,
        baseSalary: baseSalary !== undefined ? baseSalary : worker.baseSalary,
        hireDate: hireDate || worker.hireDate,
        status: status || worker.status
      })

      res.status(200).json({
        success: true,
        data: worker,
        message: 'Worker updated successfully'
      })
    } catch (error) {
      console.error('Error updating worker:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to update worker',
        error: error.message
      })
    }
  } else if (req.method === 'DELETE') {
    try {
      const worker = await Worker.findByPk(id)

      if (!worker) {
        return res.status(404).json({
          success: false,
          message: 'Worker not found'
        })
      }

      await worker.destroy()

      res.status(200).json({
        success: true,
        message: 'Worker deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting worker:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to delete worker',
        error: error.message
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

export default withAuth(handler)
