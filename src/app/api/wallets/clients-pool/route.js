import { NextResponse } from 'next/server'
let SafeEntry, sequelize

async function init() {
  if (!SafeEntry) {
    const modelsModule = require('../../../../../models')
    const models = await modelsModule.getDb()
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

export async function GET(req) {
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

    const { Op } = require('sequelize')

    // group by customer: SUM(incoming) - SUM(outgoing)
    // exclude null or empty customer strings (trimmed)
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

    const data = rows
      .map(r => ({
        customer: r.customer,
        totalIncoming: Number(r.get('totalIncoming') || 0),
        totalOutgoing: Number(r.get('totalOutgoing') || 0),
      }))
      .map(r => ({ ...r, balance: Number((r.totalIncoming - r.totalOutgoing).toFixed(2)) }))
      .filter(r => r.balance > 0)
      .sort((a, b) => b.balance - a.balance)

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
