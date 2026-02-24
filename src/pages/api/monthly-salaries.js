import { Op } from 'sequelize'

import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  const { sequelize, Attendance, Worker } = await initializeDatabase()

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { startDate, endDate } = req.query

    // Default to current month if no dates provided
    const today = new Date()
    const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    const start = startDate ? new Date(startDate) : defaultStart
    const end = endDate ? new Date(endDate) : defaultEnd

    // Set time to start/end of day
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    // Get all workers with their base salary
    const workers = await Worker.findAll({
      where: { status: 'active' },
      attributes: ['id', 'name', 'position', 'department', 'baseSalary']
    })

    // Get attendance records for the date range
    const attendanceRecords = await Attendance.findAll({
      where: {
        date: {
          [Op.gte]: start,
          [Op.lte]: end
        },
        status: {
          [Op.in]: ['present', 'half-day']
        }
      },
      attributes: ['workerId', 'date', 'status']
    })

    // Calculate monthly salary for each worker
    const monthlySummary = workers.map(worker => {
      const workerAttendance = attendanceRecords.filter(a => a.workerId === worker.id)

      // Count days: full day = 1, half day = 0.5
      let daysWorked = 0

      workerAttendance.forEach(a => {
        if (a.status === 'present') {
          daysWorked += 1
        } else if (a.status === 'half-day') {
          daysWorked += 0.5
        }
      })

      const dailyRate = parseFloat(worker.baseSalary || 0)
      const monthlySalary = daysWorked * dailyRate
      const attendanceDates = workerAttendance.map(a => a.date)

      return {
        workerId: worker.id,
        workerName: worker.name,
        position: worker.position,
        department: worker.department,
        dailyRate,
        daysWorked,
        attendanceDates,
        monthlySalary,
        monthStart: start.toISOString().split('T')[0],
        monthEnd: end.toISOString().split('T')[0]
      }
    })

    // Calculate totals
    const totalDaysWorked = monthlySummary.reduce((sum, w) => sum + w.daysWorked, 0)
    const totalMonthlySalary = monthlySummary.reduce((sum, w) => sum + w.monthlySalary, 0)

    res.status(200).json({
      success: true,
      data: {
        workers: monthlySummary,
        summary: {
          totalWorkers: workers.length,
          totalDaysWorked,
          totalMonthlySalary,
          monthStart: start.toISOString().split('T')[0],
          monthEnd: end.toISOString().split('T')[0]
        }
      },
      message: 'Monthly salaries calculated successfully'
    })
  } catch (error) {
    console.error('Error calculating monthly salaries:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to calculate monthly salaries',
      error: error.message
    })
  }
}

export default withAuth(handler)
