import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'
import { Op } from 'sequelize'

async function handler(req, res) {
  const { sequelize, DailySalary, Worker, SafeEntry } = await initializeDatabase()

  if (req.method === 'GET') {
    try {
      const { workerId, startDate, endDate } = req.query

      let where = {}
      if (workerId) where.workerId = workerId
      if (startDate || endDate) {
        where.date = {}
        if (startDate) where.date[Op.gte] = new Date(startDate)
        if (endDate) where.date[Op.lte] = new Date(endDate)
      }

      const salaries = await DailySalary.findAll({
        where,
        include: [{ model: Worker, attributes: ['id', 'name', 'position', 'baseSalary'] }],
        order: [['date', 'DESC']]
      })

      res.status(200).json({
        success: true,
        data: salaries,
        message: 'Daily salaries retrieved successfully'
      })
    } catch (error) {
      console.error('Error fetching salaries:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch salaries',
        error: error.message
      })
    }
  } else if (req.method === 'POST') {
    try {
      const { workerId, date, dailyAmount, bonus = 0, deduction = 0, notes } = req.body

      if (!workerId || !date || !dailyAmount) {
        return res.status(400).json({
          success: false,
          message: 'Worker ID, date, and daily amount are required'
        })
      }

      const totalAmount = parseFloat(dailyAmount) + parseFloat(bonus || 0) - parseFloat(deduction || 0)

      const [salary, created] = await DailySalary.findOrCreate({
        where: { workerId, date: new Date(date) },
        defaults: {
          dailyAmount: parseFloat(dailyAmount),
          bonus: parseFloat(bonus || 0),
          deduction: parseFloat(deduction || 0),
          totalAmount,
          notes
        }
      })

      if (!created) {
        const newTotal = parseFloat(dailyAmount) + parseFloat(bonus || 0) - parseFloat(deduction || 0)
        await salary.update({
          dailyAmount: parseFloat(dailyAmount),
          bonus: parseFloat(bonus || 0),
          deduction: parseFloat(deduction || 0),
          totalAmount: newTotal,
          notes
        })
      }

      // Create or update a SafeEntry outgoing record to represent salary payment
      try {
        const total = parseFloat(salary.totalAmount || 0)
        // resolve default Main Safe id if available
        let safeId = null
        try {
          const defaultSafe = await sequelize.models.Safe.findOne({ where: { isDefault: true } })
          if (defaultSafe) safeId = defaultSafe.id
        } catch (sErr) {
          console.warn('Could not resolve default safe for salary payment:', sErr.message || sErr)
        }

        const txnRef = `daily-salary:${salary.id}`

        if (created) {
          // create SafeEntry outgoing
          if (total > 0) {
            await SafeEntry.create({
              date: salary.date || new Date(),
              description: `صرف مرتب للعامل ${salary.workerId}`,
              project: null,
              customer: salary.workerId ? String(salary.workerId) : null,
              outgoing: total,
              entryType: 'outgoing',
              outgoingMethod: 'salary-payment',
              outgoingTxn: txnRef,
              safeId
            })
          }
        } else {
          // try to find existing SafeEntry linked to this salary
          const existing = await SafeEntry.findOne({ where: { outgoingTxn: txnRef } })
          if (existing) {
            if (total > 0) {
              await existing.update({ outgoing: total, description: `صرف مرتب للعامل ${salary.workerId}` })
            } else {
              // if salary reduced to zero, remove the SafeEntry
              await existing.destroy()
            }
          } else {
            if (total > 0) {
              await SafeEntry.create({
                date: salary.date || new Date(),
                description: `صرف مرتب للعامل ${salary.workerId}`,
                project: null,
                customer: salary.workerId ? String(salary.workerId) : null,
                outgoing: total,
                entryType: 'outgoing',
                outgoingMethod: 'salary-payment',
                outgoingTxn: txnRef,
                safeId
              })
            }
          }
        }
      } catch (seErr) {
        console.error('Failed to create/update SafeEntry for salary payment:', seErr)
      }

      res.status(created ? 201 : 200).json({
        success: true,
        data: salary,
        message: created ? 'Daily salary created successfully' : 'Daily salary updated successfully'
      })
    } catch (error) {
      console.error('Error saving daily salary:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to save daily salary',
        error: error.message
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

export default withAuth(handler)
