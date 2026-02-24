import { NextResponse } from 'next/server'
let Wallet, sequelize

async function init() {
  if (!Wallet) {
    const modelsModule = require('../../../../../models')
    const models = await modelsModule.getDb()
    Wallet = models.Wallet
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

export async function GET(req, { params }) {
  try {
    await init()
    let id = (await params)?.id
    // fallback: some runtime contexts may not pass params; parse from request URL
    if (!id) {
      try {
        const u = new URL(req.url)
        const parts = u.pathname.split('/')
        id = parts[parts.length - 1] || parts[parts.length - 2]
      } catch (e) {
        id = undefined
      }
    }

    // Extract JWT token from Authorization header or cookie and verify payload
    let tokenValue = null
    try {
      const authHeader = req.headers.get('authorization') || ''
      if (authHeader && authHeader.startsWith('Bearer ')) tokenValue = authHeader.slice(7)
    } catch (e) {}

    if (!tokenValue) {
      try {
        const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'token'
        const cookieHeader = req.headers.get('cookie') || ''
        const cookies = cookieHeader
          .split(';')
          .map(c => c.trim())
          .filter(Boolean)
        for (const c of cookies) {
          const idx = c.indexOf('=')
          if (idx === -1) continue
          const key = c.slice(0, idx).trim()
          const val = c.slice(idx + 1)
          if (key === COOKIE_NAME) {
            tokenValue = decodeURIComponent(val)
            break
          }
        }
      } catch (e) {}
    }

    if (!tokenValue) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Verify token and use payload id for ownership
    const payload = (function (t) {
      try {
        const jwt = require('jsonwebtoken')
        return jwt.verify(t, process.env.JWT_SECRET || 'dev-jwt-secret')
      } catch (e) {
        return null
      }
    })(tokenValue)

    if (!payload || !payload.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const userIdFromToken = payload.id

    // Instead of relying on PK lookup which experienced intermittent misses,
    // fetch the user's wallets and find the requested id among them. This
    // guarantees ownership and avoids false negatives caused by type/env issues.
    try {
      const userWallets = await Wallet.findAll({ where: { ownerId: userIdFromToken } })
      const found = userWallets.find(x => String(x.id) === String(id))
      if (!found) {
        // include lightweight diagnostics in response to help identify mismatch
        const diag = {
          tokenUserId: userIdFromToken,
          userWalletCount: (userWallets || []).length,
          walletIds: (userWallets || []).map(x => x.id),
          requestedId: id,
          requestedIdType: typeof id,
          requestedIdString: String(id)
        }
        return NextResponse.json({ error: 'Wallet not found', diag }, { status: 404 })
      }
      return NextResponse.json(found)
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req, { params }) {
  try {
    await init()
    const id = (await params).id
    const body = await req.json()
    const { allowMainSafeWithdraw } = body

    // Authenticate user (Authorization header Bearer token OR cookie)
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

    // Check DB column exists
    const qi = sequelize.getQueryInterface()
    const tableDef = await qi.describeTable('wallets')
    if (!tableDef || !tableDef.allowMainSafeWithdraw) {
      return NextResponse.json(
        { error: 'Server: migrations not applied (allowMainSafeWithdraw missing)' },
        { status: 500 }
      )
    }

    const w = await Wallet.findByPk(id)
    if (!w) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })

    // Ensure the requesting user owns the wallet
    if (w.ownerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await w.update({ allowMainSafeWithdraw: !!allowMainSafeWithdraw })
    return NextResponse.json(w)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
