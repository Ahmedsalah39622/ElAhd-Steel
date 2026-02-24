import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await initializeDatabase()
    const { withdrawRaw } = require('@/services/inventoryService')
    const { materialId, quantity = 1, client = null, allowNegative = false } = req.body || {}
    const result = await withdrawRaw({
      materialId,
      quantity: Number(quantity || 1),
      client,
      user: req.user || null,
      allowNegative: !!allowNegative
    })
    return res.status(201).json(result)
  } catch (err) {
    console.error('withdraw-raw error', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
}

export default withAuth(handler)
