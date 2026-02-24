import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  const { JobOrder, InventoryTransaction, sequelize } = await initializeDatabase()

  if (req.method === 'GET') {
    try {
        const { id, status } = req.query
        const where = {}
        if (id) where.id = id
        if (status) where.status = status

        const orders = await JobOrder.findAll({
            where,
            include: [{ 
                model: InventoryTransaction, 
                as: 'transactions',
                attributes: ['id', 'materialId', 'change', 'note'] 
            }],
            order: [['createdAt', 'DESC']]
        })
        return res.status(200).json(orders)
    } catch (e) {
        console.error('JobOrder GET error:', e)
        return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'POST') {
    const { 
        orderNumber, 
        clientName, 
        projectCode, 
        specifications, 
        calculations, 
        accessories, 
        engineeringDrawing,
        transactionIds // Optional: Link existing transactions
    } = req.body

    try {
        const result = await sequelize.transaction(async t => {
            // Create Job Order
            const order = await JobOrder.create({
                orderNumber: orderNumber || `JO-${Date.now()}`,
                clientName,
                projectCode,
                status: 'pending',
                specifications,
                calculations,
                accessories,
                engineeringDrawing
            }, { transaction: t })

            // Link Transactions if provided
            if (transactionIds && Array.isArray(transactionIds) && transactionIds.length > 0) {
                await InventoryTransaction.update(
                    { jobOrderId: order.id },
                    { where: { id: transactionIds }, transaction: t }
                )
            }
            
            return order
        })
        return res.status(201).json(result)
    } catch (e) {
        console.error('JobOrder POST error:', e)
        return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'PUT') {
      const { id } = req.query
      const updateData = req.body
      
      try {
          const order = await JobOrder.findByPk(id)
          if (!order) return res.status(404).json({ error: 'Order not found' })
          
          await order.update(updateData)
          return res.status(200).json(order)
      } catch (e) {
          console.error('JobOrder PUT error:', e)
          return res.status(500).json({ error: e.message })
      }
  }

  if (req.method === 'DELETE') {
      const { id } = req.query
      try {
          const order = await JobOrder.findByPk(id)
          if (!order) return res.status(404).json({ error: 'Order not found' })
          await order.destroy()
          return res.status(200).json({ success: true })
      } catch (e) {
           return res.status(500).json({ error: e.message })
      }
  }

  res.status(405).json({ error: 'Method not allowed' })
}

export default withAuth(handler)
