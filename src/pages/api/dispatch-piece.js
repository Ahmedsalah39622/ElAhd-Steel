import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { Invoice, Material, MaterialPiece, sequelize } = await initializeDatabase()

    const { pieceId, clientId, length, width, materialId, price = 0 } = req.body

    if (!clientId) {
      return res.status(400).json({ error: 'clientId is required' })
    }

    if (!length || !width) {
      return res.status(400).json({ error: 'length and width are required' })
    }

    // Get material info for description
    let materialName = 'Material'
    let sku = ''
    if (materialId) {
      const material = await Material.findByPk(materialId)
      if (material) {
        materialName = material.name || 'Material'
        sku = material.sku || ''
      }
    }

    // Find existing draft invoice for this client (DO NOT create automatically)
    let invoice = await Invoice.findOne({
      where: { clientId, status: 'draft' },
      order: [['createdAt', 'DESC']]
    })

    // If no draft invoice exists, just update piece status without creating invoice
    if (!invoice) {
      if (pieceId && MaterialPiece) {
        try {
          const piece = await MaterialPiece.findByPk(pieceId)
          if (piece) {
            const qi = sequelize.getQueryInterface()
            const tableDef = await qi.describeTable('material_pieces')
            const updatePayload = { status: 'dispatched' }
            if (tableDef && tableDef.clientId) updatePayload.clientId = clientId
            await piece.update(updatePayload)
          }
        } catch (e) {
          console.error('Failed to update piece status:', e)
        }
      }

      // Deduct from client budget immediately when dispatching (if price > 0)
      let budgetDeducted = 0

      try {
        const Client = sequelize.models.Client
        if (Client && clientId && Number(price) > 0) {
          const client = await Client.findByPk(clientId)
          if (client) {
            const currentBudget = Number(client.budget || 0)
            const deduct = Math.min(currentBudget, Number(price) || 0)
            if (deduct > 0) {
              await client.update({ budget: currentBudget - deduct })
              budgetDeducted = deduct
            }
          }
        }
      } catch (e) {
        console.error('Failed to deduct client budget on dispatch (no invoice):', e)
      }

      return res.status(200).json({
        success: true,
        message: 'تم صرف القطعة بدون فاتورة - يمكنك إنشاء فاتورة يدوياً',
        pieceDispatched: true,
        invoiceCreated: false,
        budgetDeducted
      })
    }

    // Parse existing items
    let items = []
    try {
      items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items || []
      if (!Array.isArray(items)) items = []
    } catch (e) {
      items = []
    }

    // Create new item
    const dims = `${length}x${width}`
    const description = `قطعة ${materialName} (${dims})${pieceId ? ` - #${pieceId}` : ''}`

    const newItem = {
      description,
      materialId,
      sku,
      isPiece: true,
      length: Number(length),
      width: Number(width),
      pieceId: pieceId || null,
      qty: 1,
      price: Number(price) || 0,
      total: Number(price) || 0
    }

    items.push(newItem)

    // Recalculate invoice total
    const newTotal = items.reduce((sum, i) => sum + (Number(i.total) || 0), 0)

    // Update invoice
    await invoice.update({
      items: JSON.stringify(items),
      total: newTotal
    })

    // Deduct from client budget immediately on dispatch (if price > 0)
    let budgetDeducted = 0

    try {
      const Client = sequelize.models.Client
      if (Client && clientId && Number(price) > 0) {
        const client = await Client.findByPk(clientId)
        if (client) {
          const currentBudget = Number(client.budget || 0)
          const deduct = Math.min(currentBudget, Number(price) || 0)
          if (deduct > 0) {
            await client.update({ budget: currentBudget - deduct })
            budgetDeducted = deduct

            // reflect deduction on invoice paidAmount
            const currentPaid = Number(invoice.paidAmount || 0)
            await invoice.update({ paidAmount: currentPaid + deduct })
          }
        }
      }
    } catch (e) {
      console.error('Failed to deduct client budget on dispatch (invoice):', e)
    }

    // If pieceId provided, update the piece status to 'dispatched'
    if (pieceId && MaterialPiece) {
      try {
        const piece = await MaterialPiece.findByPk(pieceId)
        if (piece) {
          const qi = sequelize.getQueryInterface()
          const tableDef = await qi.describeTable('material_pieces')
          const updatePayload = { status: 'dispatched' }
          if (tableDef && tableDef.clientId) updatePayload.clientId = clientId
          await piece.update(updatePayload)
        }
      } catch (e) {
        console.error('Failed to update piece status:', e)
      }
    }

    return res.status(200).json({
      success: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      item: newItem,
      budgetDeducted
    })
  } catch (err) {
    console.error('dispatch-piece error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}

export default withAuth(handler)
