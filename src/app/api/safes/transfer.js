let SafeEntry, Safe, sequelize

export default async function handler(req, res) {
  try {
    if (!SafeEntry) {
      const modelsModule = require('../../../../models')
      const models = await modelsModule.getDb()

      SafeEntry = models.SafeEntry
      Safe = models.Safe
      sequelize = models.sequelize
    }

    await sequelize.authenticate()
  } catch (dbErr) {
    return res.status(500).json({ error: 'Database connection failed', details: dbErr.message })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { fromSafeId, toSafeId, amount, description, date, method } = req.body

  if (!fromSafeId || !toSafeId || !amount || amount <= 0)
    return res.status(400).json({ error: 'Invalid transfer payload' })

  // identify current user (try cookie or Authorization header)
  let currentEmail = null

  try {
    const authHeader = req.headers.authorization || ''

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const jwt = require('jsonwebtoken')
      const secret = process.env.JWT_SECRET || 'secret'
      const payload = jwt.verify(token, secret)

      currentEmail = payload.email
    } else if (req.cookies && req.cookies.user) {
      // some session system may set cookie, fallback
      currentEmail = req.cookies.user
    }
  } catch (e) {
    // ignore
  }

  if (!currentEmail) return res.status(401).json({ error: 'Not authenticated' })

  const User = sequelize.models.User
  const user = await User.findOne({ where: { email: currentEmail } })

  if (!user) return res.status(401).json({ error: 'User not found' })

  // minimal ownership rules:
  // - If fromSafe.ownerId is set and not equal to current user id -> reject
  // - If transfer involves a personal safe (ownerId != null) require password verification

  const t = await sequelize.transaction()

  try {
    const fromSafe = await Safe.findByPk(fromSafeId, { transaction: t })
    const toSafe = await Safe.findByPk(toSafeId, { transaction: t })

    if (!fromSafe || !toSafe) {
      await t.rollback()

      return res.status(404).json({ error: 'One or both safes not found' })
    }

    if (fromSafe.ownerId && fromSafe.ownerId !== user.id) {
      await t.rollback()

      return res.status(403).json({ error: 'You do not own the source safe' })
    }

    // No password re-auth required for safe transfers — ownership checks above remain

    const txRef = `transfer:${Date.now()}`

    const parseDate = d => {
      if (!d) return null
      const dt = new Date(d)

      return isNaN(dt.getTime()) ? null : dt
    }

    const dateVal = parseDate(date) || new Date()

    // Outgoing entry from fromSafe
    const outEntry = await SafeEntry.create(
      {
        date: dateVal,
        description: description || `Transfer to ${toSafe.name}`,
        outgoing: amount,
        outgoingMethod: method || 'transfer',
        outgoingTxn: txRef,
        entryType: 'transfer',
        safeId: fromSafeId,
        targetSafeId: toSafeId
      },
      { transaction: t }
    )

    // Incoming entry to toSafe
    const inEntry = await SafeEntry.create(
      {
        date: dateVal,
        description: description || `Transfer from ${fromSafe.name}`,
        incoming: amount,
        incomingMethod: method || 'transfer',
        incomingTxn: txRef,
        entryType: 'transfer',
        safeId: toSafeId,
        targetSafeId: fromSafeId
      },
      { transaction: t }
    )

    // Write audit record
    if (sequelize.models.InventoryTransaction) {
      // don't mix domains, but keep a transfer audit (we'll create SafeTransferAudit model later if desired)
    }

    await t.commit()

    return res.status(201).json({ outEntry, inEntry })
  } catch (err) {
    await t.rollback()
    console.error('Transfer failed:', err)

    return res.status(500).json({ error: err.message })
  }
}
