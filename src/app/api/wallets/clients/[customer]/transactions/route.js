import { NextResponse } from 'next/server'
let SafeEntry, sequelize

async function init() {
  if (!SafeEntry) {
    const modelsModule = require('../../../../../../../models')
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

export async function POST(req, { params }) {
  try {
    await init()

    // no password required to view client transactions (authenticated request)
    const body = await req.json()
    // `params` should be provided by Next, but in some runtimes it may be undefined.
    // Fall back to parsing the URL path to extract the customer segment.
    let cust = (await params)?.customer
    if (!cust) {
      try {
        const u = new URL(req.url)
        // expected path: /api/wallets/clients/:customer/transactions
        const parts = u.pathname.split('/').filter(Boolean)
        const idx = parts.findIndex(p => p === 'clients')
        if (idx >= 0 && parts.length > idx + 1) {
          cust = parts[idx + 1]
        }
      } catch (e) {
        // ignore parse errors
      }
    }

    if (!cust) {
      return NextResponse.json(
        { error: 'Missing customer parameter', path: req.url, params: params || null },
        { status: 400 }
      )
    }

    // Auth (get current user email via token/cookie)
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
        const match = cookieHeader
          .split(';')
          .map(c => c.trim())
          .find(c => c.startsWith(`${COOKIE_NAME}=`))
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
    // no password verify — authenticated user may view client transactions

    // Fetch all SafeEntry rows for this customer (ordered desc)
    const txs = await SafeEntry.findAll({
      where: { customer: decodeURIComponent(cust) },
      order: [
        ['date', 'DESC'],
        ['createdAt', 'DESC']
      ]
    })

    return NextResponse.json(txs)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
