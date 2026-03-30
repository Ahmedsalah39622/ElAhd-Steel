import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({ success: false, message: 'Supplier ID is required' })
  }

  try {
    const { sequelize, Supplier, PurchaseOrder, SafeEntry, Material } = await initializeDatabase()

    // Get supplier info
    const supplier = await Supplier.findByPk(id)
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' })
    }

    // Get all purchase orders for this supplier
    const purchaseOrders = await PurchaseOrder.findAll({
      where: { supplierId: id },
      include: Material ? [{ model: Material, as: 'material', attributes: ['id', 'name', 'materialName'] }] : [],
      order: [['createdAt', 'DESC']]
    })

    const ordersPlain = purchaseOrders.map(po => po.get ? po.get({ plain: true }) : po)

    // Get all payments (SafeEntry with this supplierId - outgoing)
    const payments = await SafeEntry.findAll({
      where: { supplierId: id },
      order: [['date', 'DESC']],
      raw: true
    })

    // Calculate totals
    const totalPurchases = ordersPlain.reduce((sum, po) => sum + Number(po.totalAmount || 0), 0)
    const totalPaidOnOrders = ordersPlain.reduce((sum, po) => sum + Number(po.paidAmount || 0), 0)
    const totalPayments = payments
      .filter(p => p.entryType === 'supplier-payment')
      .reduce((sum, p) => sum + Number(p.outgoing || 0), 0)
    const balance = totalPurchases - totalPaidOnOrders - totalPayments

    // Format transactions timeline
    const transactions = [
      ...ordersPlain.map(po => ({
        id: `po-${po.id}`,
        type: 'purchase',
        typeLabel: 'أمر شراء',
        date: po.createdAt,
        description: `أمر شراء ${po.orderNumber}${po.material ? ` - ${po.material.name || po.material.materialName}` : ''}`,
        amount: Number(po.totalAmount || 0),
        paidAmount: Number(po.paidAmount || 0),
        paymentStatus: po.paymentStatus || 'paid',
        reference: po.orderNumber
      })),
      ...payments.map(p => ({
        id: `pay-${p.id}`,
        type: 'payment',
        typeLabel: 'دفعة',
        date: p.date || p.createdAt,
        description: p.description || 'دفعة للمورد',
        amount: Number(p.outgoing || 0),
        method: p.outgoingMethod,
        reference: p.outgoingTxn
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date))

    res.status(200).json({
      success: true,
      data: {
        supplier: {
          id: supplier.id,
          name: supplier.name,
          phone: supplier.phone,
          email: supplier.email
        },
        summary: {
          totalPurchases,
          totalPaid: totalPaidOnOrders + totalPayments,
          balance,
          hasDebt: balance > 0
        },
        transactions,
        purchaseOrders: ordersPlain,
        payments
      }
    })
  } catch (error) {
    console.error('Error fetching supplier transactions:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    })
  }
}

export default withAuth(handler)
