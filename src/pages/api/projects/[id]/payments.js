import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  const { id } = req.query // project id

  try {
    const { ProjectPayment, ProjectActivity, Invoice, sequelize } = await initializeDatabase()

    if (req.method === 'GET') {
      const rawCols = await sequelize.getQueryInterface().describeTable('project_payments')
      const availableCols = Object.keys(rawCols)

      if (!availableCols.includes('projectId')) {
        return res.status(200).json({ success: true, data: [], message: 'Database missing projectId column' })
      }

      const payments = await ProjectPayment.findAll({
        where: { projectId: id },
        include: [{ model: Invoice, as: 'invoice', required: false }],
        order: [['paidAt', 'DESC']]
      })

      return res.status(200).json({ success: true, data: payments })
    }

    if (req.method === 'POST') {
      const { invoiceId, amount, paymentMethod, paymentType, reference, bankName, transactionNumber, notes, paidAt } =
        req.body

      if (!amount) {
        return res.status(400).json({ success: false, message: 'Payment amount is required' })
      }

      const rawCols = await sequelize.getQueryInterface().describeTable('project_payments')
      const availableCols = Object.keys(rawCols)

      const saveBody = {
        projectId: id,
        invoiceId: invoiceId || null,
        amount,
        paymentMethod,
        paymentType: paymentType || 'incoming',
        reference,
        bankName,
        transactionNumber,
        notes,
        paidAt: paidAt || new Date()
      }

      if (!availableCols.includes('projectId')) {
        delete saveBody.projectId
      }

      const payment = await ProjectPayment.create(saveBody)

      // Log activity
      const typeLabel = paymentType === 'outgoing' ? 'دفعة صادرة' : 'دفعة واردة'

      await ProjectActivity.create({
        projectId: id,
        activityType: 'payment_recorded',
        title: typeLabel,
        description: `تم تسجيل ${typeLabel} بقيمة ${amount} ج.م`,
        createdBy: req.user?.username || 'System'
      })

      return res.status(201).json({ success: true, data: payment })
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Project Payments API error:', error)
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
}

export default withAuth(handler)
