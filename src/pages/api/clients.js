import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { sequelize, Client, Invoice, SafeEntry } = await initializeDatabase()

      const clients = await Client.findAll({ order: [['createdAt', 'DESC']] })

      // Parse material field and calculate balance for each client
      const parsed = await Promise.all(
        clients.map(async c => {
          const obj = c.get ? c.get({ plain: true }) : c
          try {
            obj.material = obj.material ? JSON.parse(obj.material) : []
          } catch (e) {
            // keep original string if not JSON
          }

          // Calculate client balance
          try {
            const totalInvoices = (await Invoice.sum('total', { where: { clientId: obj.id } })) || 0
            const totalPaidFromInvoices = (await Invoice.sum('paidAmount', { where: { clientId: obj.id } })) || 0
            const totalPayments =
              (await SafeEntry.sum('incoming', {
                where: {
                  clientId: obj.id,
                  entryType: 'client-payment'
                }
              })) || 0
            obj.balance = Number(totalInvoices) - Number(totalPaidFromInvoices) - Number(totalPayments)
            obj.hasDebt = obj.balance > 0
          } catch (balanceErr) {
            console.error('Error calculating balance for client:', obj.id, balanceErr)
            obj.balance = 0
            obj.hasDebt = false
          }

          return obj
        })
      )

      res.status(200).json({ success: true, data: parsed, message: 'Clients retrieved successfully' })
    } catch (error) {
      console.error('Error fetching clients:', error)
      res.status(500).json({ success: false, message: 'Failed to fetch clients', error: error.message })
    }
  } else if (req.method === 'POST') {
    try {
      const { Client, Wallet, SafeEntry, sequelize } = await initializeDatabase()
      const { name, phone, profile, budget, material } = req.body

      if (!name) {
        return res.status(400).json({ success: false, message: 'Client name is required' })
      }

      const materialToSave = Array.isArray(material) ? JSON.stringify(material) : material

      // Sanitize inputs
      const safeBudget = budget === '' || budget === null ? 0 : budget
      const safePhone = phone === '' ? null : phone
      const safeProfile = profile === '' ? null : profile

      const client = await Client.create({
        name,
        phone: safePhone,
        profile: safeProfile,
        budget: safeBudget,
        material: materialToSave
      })

      // return parsed material
      const out = client.get ? client.get({ plain: true }) : client
      try {
        out.material = out.material ? JSON.parse(out.material) : []
      } catch (e) {}

      // If the client has a positive budget, create a wallet for the authenticated user
      try {
        const clientBudget = Number(budget || 0)
        if (clientBudget > 0 && req.user && req.user.id) {
          await Wallet.create({ ownerId: req.user.id, name: `محفظة ${out.name}`, balance: clientBudget })
        }
      } catch (wErr) {
        console.error('Failed to create wallet for new client:', wErr)
        // Do not fail the client creation if wallet creation fails
      }

      // Also create a SafeEntry incoming record to record the client's budget as an عربون (deposit)
      try {
        const clientBudget = Number(budget || 0)
        if (clientBudget > 0) {
          // resolve default Main Safe id if available
          let safeId = null
          const { Safe } = await initializeDatabase() // Check if Safe is returned
          if (Safe) {
            const defaultSafe = await Safe.findOne({ where: { isDefault: true } })
            if (defaultSafe) safeId = defaultSafe.id
          }

          if (safeId && SafeEntry) {
            await SafeEntry.create({
              date: new Date(),
              description: `عربون تسجيل عميل ${out.name}`,
              customer: out.name,
              incoming: clientBudget,
              entryType: 'incoming',
              incomingMethod: 'client-registration-deposit',
              safeId
            })
          }
        }
      } catch (seErr) {
        console.error('Failed to create SafeEntry for client deposit:', seErr)
        // Do not fail client creation if safe entry creation fails
      }

      res.status(201).json({ success: true, data: out, message: 'Client created successfully' })
    } catch (error) {
      console.error('Error creating client:', error)
      res.status(500).json({ success: false, message: 'Failed to create client', error: error.message })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

export default withAuth(handler)
