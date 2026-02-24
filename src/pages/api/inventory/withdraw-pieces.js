import { initializeDatabase } from '@/utils/db'
import { withAuth } from '@/utils/auth'

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await initializeDatabase()
    const { withdrawPieces } = require('@/services/inventoryService')
    const { materialId, reqLength, reqWidth, qty = 1, client = null, allowNegative = false } = req.body || {}

    const results = []
    for (let i = 0; i < Math.max(1, Number(qty || 1)); i++) {
      const r = await withdrawPieces({
        materialId,
        reqLength: Number(reqLength),
        reqWidth: Number(reqWidth),
        client,
        user: req.user || null,
        allowNegative: !!allowNegative
      })
      results.push(r)
    }

    return res.status(201).json({ results })
  } catch (err) {
    console.error('withdraw-pieces error', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
}

export default withAuth(handler)
