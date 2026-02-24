// src/app/api/safe/safe.js
// Dynamically require models at runtime only
let SafeEntry, sequelize

export default async function handler(req, res) {
  try {
    // Lazy load at runtime using getDb()
    if (!SafeEntry) {
      const modelsModule = require('../../../../models')
      const models = await modelsModule.getDb()
      SafeEntry = models.SafeEntry
      sequelize = models.sequelize
    }
    await sequelize.authenticate()
  } catch (dbErr) {
    return res.status(500).json({ error: 'Database connection failed', details: dbErr.message })
  }

  if (req.method === 'GET') {
    try {
      // Support optional safeId filter: /api/safe?safeId=123
      let safeIdParam = null
      try {
        if (req.query && req.query.safeId) safeIdParam = req.query.safeId
        else if (req.url) {
          const parsed = new URL(req.url, 'http://localhost')
          safeIdParam = parsed.searchParams.get('safeId')
        }
      } catch (e) {
        safeIdParam = null
      }

      const query = { order: [['date', 'DESC']] }
      if (safeIdParam) {
        const sid = parseInt(safeIdParam, 10)
        if (!isNaN(sid)) query.where = { safeId: sid }
      }

      const entries = await SafeEntry.findAll(query)
      return res.status(200).json(entries)
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  if (req.method === 'POST') {
    const {
      month,
      date,
      description,
      project,
      incoming,
      incomingMethod,
      incomingTxn,
      outgoing,
      outgoingMethod,
      outgoingTxn,
      balance,
      clientId,
      supplierId
    } = req.body

    try {
      // Check if both incoming and outgoing are 0 or empty
      const incomingValue = parseFloat(incoming) || 0
      const outgoingValue = parseFloat(outgoing) || 0

      if (incomingValue === 0 && outgoingValue === 0) {
        return res.status(400).json({ error: 'لا يمكن إضافة قيد بدون مبلغ وارد أو صادر' })
      }

      const parseDate = d => {
        if (!d) return null
        const dt = new Date(d)
        return isNaN(dt.getTime()) ? null : dt
      }
      const dateVal = parseDate(date)
      // Resolve default safe id (Main Safe) if available
      let safeId = null
      if (sequelize.models.Safe) {
        const defaultSafe = await sequelize.models.Safe.findOne({ where: { isDefault: true } })
        if (defaultSafe) safeId = defaultSafe.id
      }

      const entry = await SafeEntry.create({
        month,
        date: dateVal || null,
        description,
        project,
        incoming,
        incomingMethod,
        incomingTxn,
        outgoing,
        outgoingMethod,
        outgoingTxn,
        outgoingTxn,
        balance,
        safeId,
        clientId: clientId || null,
        supplierId: supplierId || null
      })
      return res.status(201).json(entry)
    } catch (err) {
      console.error('SafeEntry create failed:', err)
      return res.status(400).json({ error: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
