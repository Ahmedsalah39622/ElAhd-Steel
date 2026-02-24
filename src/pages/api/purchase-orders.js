import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { sequelize, PurchaseOrder, Supplier, Material } = await initializeDatabase()

      const purchaseOrders = await PurchaseOrder.findAll({
        include: [
          {
            association: 'supplier',
            attributes: ['id', 'name', 'email', 'phone', 'address', 'bankName', 'accountNumber', 'iban']
          },
          {
            association: 'material',
            attributes: ['id', 'name', 'materialName', 'sku', 'grade']
          }
        ],
        order: [['createdAt', 'DESC']]
      })

      res.status(200).json({
        success: true,
        data: purchaseOrders,
        message: 'Purchase orders retrieved successfully'
      })
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch purchase orders',
        error: error.message
      })
    }
  } else if (req.method === 'POST') {
    try {
      const { sequelize, PurchaseOrder } = await initializeDatabase()

      const { supplierId, materialId, weight, price, quantity, recipient, paymentMethod, transactionNumber, notes, paymentStatus, paidAmount } =
        req.body

      // Validation
      if (!supplierId || !materialId || !price || !quantity) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        })
      }

      if ((paymentMethod === 'online' || paymentMethod === 'wallet') && !transactionNumber) {
        return res.status(400).json({
          success: false,
          message: 'Transaction number is required for online/wallet payments'
        })
      }

      // Generate order number
      const timestamp = Date.now()
      const orderNumber = `PO-${timestamp}`

      const totalAmount = parseFloat(price) * parseInt(quantity)

      // Determine payment status
      const status = paymentStatus || (paymentMethod === 'credit' ? 'credit' : 'paid')
      const paid = paidAmount !== undefined ? parseFloat(paidAmount) : (status === 'paid' ? totalAmount : 0)

      const purchaseOrder = await PurchaseOrder.create({
        orderNumber,
        supplierId,
        materialId,
        weight,
        price,
        quantity,
        recipient: recipient || null,
        paymentMethod,
        transactionNumber: transactionNumber || null,
        totalAmount,
        notes,
        paymentStatus: status,
        paidAmount: paid
      })

      res.status(201).json({
        success: true,
        data: purchaseOrder,
        message: 'Purchase order created successfully'
      })
    } catch (error) {
      console.error('Error creating purchase order:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to create purchase order',
        error: error.message
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

export default withAuth(handler)
