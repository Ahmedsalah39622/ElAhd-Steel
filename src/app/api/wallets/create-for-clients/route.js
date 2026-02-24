import { NextResponse } from 'next/server'
let Wallet, SafeEntry, sequelize

async function init() {
  if (!Wallet) {
    const modelsModule = require('../../../../../models')
    const models = await modelsModule.getDb()
    Wallet = models.Wallet
    SafeEntry = models.SafeEntry
    sequelize = models.sequelize
  }
}

function verifyTokenAndGetEmail(token) {
  try {
    const jwt = require('jsonwebtoken')
    const secret = process.env.JWT_SECRET || 'dev-jwt-secret'
    const payload = jwt.verify(token, secret)
    return payload && payload.email ? payload.email : null
  } catch (e) {
    return null
  }
}

export async function POST(req) {
  try {
    await init()

    // Auth
    let currentEmail = null
    try {
      const authHeader = req.headers.get('authorization') || ''
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        currentEmail = verifyTokenAndGetEmail(token)
      }
    } catch (e) {}

    if (!currentEmail) {
      try {
        const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'token'
        const cookieHeader = req.headers.get('cookie') || ''
        const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith(`${COOKIE_NAME}=`))
        if (match) {
          const token = match.split('=')[1]
          currentEmail = verifyTokenAndGetEmail(token)
        }
      } catch (e) {}
    }

    if (!currentEmail) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const User = sequelize.models.User
    const user = await User.findOne({ where: { email: currentEmail } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 })

    const { Op } = require('sequelize')

    const rows = await SafeEntry.findAll({
      attributes: ['customer', [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('incoming')), 0), 'totalIncoming'], [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('outgoing')), 0), 'totalOutgoing']],
      where: {
        [Op.and]: [
          { customer: { [Op.ne]: null } },
          sequelize.where(sequelize.fn('TRIM', sequelize.col('customer')), { [Op.ne]: '' })
        ]
      },
      group: ['customer']
    })

    const balances = rows
      .map(r => ({ customer: r.customer, totalIncoming: Number(r.get('totalIncoming') || 0), totalOutgoing: Number(r.get('totalOutgoing') || 0) }))
      .map(r => ({ ...r, balance: Number((r.totalIncoming - r.totalOutgoing).toFixed(2)) }))
      .filter(r => r.balance > 0)

    // Also include clients that have a positive `budget` field in clients table
    const Client = sequelize.models.Client
    let clientRows = []
    try {
      clientRows = await Client.findAll({ where: { budget: { [Op.gt]: 0 } } })
    } catch (e) {
      // ignore if Client model/table not available
    }

    const clientBalances = (clientRows || []).map(c => ({ customer: c.name, balance: Number(c.budget || 0), _isClientBudget: true }))

    // Merge SafeEntry balances with client budget balances, preferring client budget when present
    const mergedMap = new Map()

    for (const b of balances) {
      const key = String(b.customer).trim()
      mergedMap.set(key, { customer: key, balance: b.balance, fromSafe: true })
    }

    for (const cb of clientBalances) {
      const key = String(cb.customer).trim()
      // prefer client budget value
      mergedMap.set(key, { customer: key, balance: cb.balance, fromClient: true })
    }

    const merged = Array.from(mergedMap.values()).filter(r => r.balance > 0)

    const userWallets = await Wallet.findAll({ where: { ownerId: user.id } })

    const created = []

    for (const c of merged) {
      const customer = c.customer
      if (!customer) continue

      const exists = (userWallets || []).some(w => String(w.name || '').includes(String(customer)))
      if (exists) continue

      const qi = sequelize.getQueryInterface()
      const tableDef = await qi.describeTable('wallets')
      // If client budget was the source, set balance to that amount; otherwise default to 0
      const payload = { ownerId: user.id, name: `محفظة ${customer}`, balance: c.balance || 0 }
      if (tableDef && tableDef.allowMainSafeWithdraw) payload.allowMainSafeWithdraw = false

      try {
        const w = await Wallet.create(payload, { fields: Object.keys(payload) })
        created.push(w)
      } catch (dbErr) {
        // ignore individual create errors, continue
        console.error('wallet create error for', customer, dbErr.message || dbErr)
      }
    }

    return NextResponse.json({ createdCount: created.length, created })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
