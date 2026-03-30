import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { sequelize, Supplier, PurchaseOrder, SafeEntry } = await initializeDatabase()

      const suppliers = await Supplier.findAll({
        order: [['createdAt', 'DESC']]
      })

      // Calculate balance for each supplier
      const suppliersWithBalance = await Promise.all(
        suppliers.map(async s => {
          const obj = s.get ? s.get({ plain: true }) : s

          // Calculate supplier balance
          try {
            const totalPurchases = (await PurchaseOrder.sum('totalAmount', { where: { supplierId: obj.id } })) || 0
            const totalPaidFromOrders = (await PurchaseOrder.sum('paidAmount', { where: { supplierId: obj.id } })) || 0
            const totalPayments =
              (await SafeEntry.sum('outgoing', {
                where: {
                  supplierId: obj.id,
                  entryType: 'supplier-payment'
                }
              })) || 0
            obj.balance = Number(totalPurchases) - Number(totalPaidFromOrders) - Number(totalPayments)
            obj.hasDebt = obj.balance > 0
          } catch (balanceErr) {
            console.error('Error calculating balance for supplier:', obj.id, balanceErr)
            obj.balance = 0
            obj.hasDebt = false
          }

          return obj
        })
      )

      res.status(200).json({
        success: true,
        data: suppliersWithBalance,
        message: 'Suppliers retrieved successfully'
      })
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch suppliers',
        error: error.message
      })
    }
  } else if (req.method === 'POST') {
    try {
      const { sequelize, Supplier } = await initializeDatabase()

      const { name, email, phone, address, city, country, bankName, accountNumber, iban } = req.body

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Supplier name is required'
        })
      }

      const supplier = await Supplier.create({
        name,
        email,
        phone,
        address,
        city,
        country,
        bankName,
        accountNumber,
        iban
      })

      res.status(201).json({
        success: true,
        data: supplier,
        message: 'Supplier created successfully'
      })
    } catch (error) {
      console.error('Error creating supplier:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to create supplier',
        error: error.message
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

export default withAuth(handler)
