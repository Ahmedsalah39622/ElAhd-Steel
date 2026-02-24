import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'
import { Op } from 'sequelize'

async function handler(req, res) {
  const { sequelize, Attendance, Worker } = await initializeDatabase()

  if (req.method === 'GET') {
    try {
      const { workerId, startDate, endDate, device } = req.query

      let where = {}
      if (workerId) where.workerId = workerId
      if (startDate || endDate) {
        where.date = {}
        if (startDate) where.date[Op.gte] = new Date(startDate)
        if (endDate) where.date[Op.lte] = new Date(endDate)
      }

      if (device) {
        // filter by device name/id appearing in either check-in or check-out device
        where[Op.or] = [{ checkInDevice: device }, { checkOutDevice: device }]
      }

      const attendance = await Attendance.findAll({
        where,
        include: [{ model: Worker, attributes: ['id', 'name', 'position'] }],
        order: [['date', 'DESC']]
      })

      res.status(200).json({
        success: true,
        data: attendance,
        message: 'Attendance records retrieved successfully'
      })
    } catch (error) {
      console.error('Error fetching attendance:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch attendance',
        error: error.message
      })
    }
  } else if (req.method === 'POST') {
    try {
      const { workerId, date, status, checkInTime, checkOutTime, notes, checkInDevice, checkOutDevice } = req.body

      if (!workerId || !date) {
        return res.status(400).json({
          success: false,
          message: 'Worker ID and date are required'
        })
      }

      const [attendance, created] = await Attendance.findOrCreate({
        where: { workerId, date: new Date(date) },
        defaults: {
          status: status || 'present',
          checkInTime,
          checkOutTime,
          checkInDevice,
          checkOutDevice,
          notes
        }
      })

      if (!created) {
        await attendance.update({
          status: status || attendance.status,
          checkInTime: checkInTime || attendance.checkInTime,
          checkOutTime: checkOutTime || attendance.checkOutTime,
          checkInDevice: checkInDevice || attendance.checkInDevice,
          checkOutDevice: checkOutDevice || attendance.checkOutDevice,
          notes: notes || attendance.notes
        })
      }

      res.status(created ? 201 : 200).json({
        success: true,
        data: attendance,
        message: created ? 'Attendance created successfully' : 'Attendance updated successfully'
      })
    } catch (error) {
      console.error('Error saving attendance:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to save attendance',
        error: error.message
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

export default withAuth(handler)
