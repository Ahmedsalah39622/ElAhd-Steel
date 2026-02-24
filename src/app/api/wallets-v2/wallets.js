import { NextResponse } from 'next/server'

let WalletV2, sequelize

async function init() {
  if (!WalletV2) {
    const modelsModule = require('../../../../models')
    const models = await modelsModule.getDb()

    WalletV2 = models.WalletV2
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

    // auth via cookie or Authorization
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

    const wallets = await WalletV2.findAll({ where: { ownerId: user.id } })

    return NextResponse.json(wallets)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    await init()
    const body = await req.json()
    const { name, requirePasswordAccess, allowMainSafeWithdraw } = body

    // identify user
    let currentEmail = null

    try {
      const authHeader = req.headers.get('authorization') || ''

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        const jwt = require('jsonwebtoken')
        const secret = process.env.JWT_SECRET || 'secret'
        const payload = jwt.verify(token, secret)

        currentEmail = payload.email
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

    const payload = { ownerId: user.id, name: name || 'Personal Wallet', balance: 0 }

    if (typeof requirePasswordAccess !== 'undefined') payload.requirePasswordAccess = !!requirePasswordAccess
    if (typeof allowMainSafeWithdraw !== 'undefined') payload.allowMainSafeWithdraw = !!allowMainSafeWithdraw

    const w = await WalletV2.create(payload)

    return NextResponse.json(w, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
