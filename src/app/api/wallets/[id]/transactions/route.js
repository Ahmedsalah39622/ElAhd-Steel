import { NextResponse } from 'next/server'
let Wallet, WT, sequelize

async function init() {
  if (!Wallet) {
    const modelsModule = require('@models')
    const models = await modelsModule.getDb()
    Wallet = models.Wallet
    WT = models.WalletTransaction
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

export async function GET(req, ctx) {
  try {
    await init()
    const params = ctx && ctx.params ? await ctx.params : {}
    const walletId = params.id

    // Auth (Bearer or cookie)
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

    const wallet = await Wallet.findByPk(walletId)
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })

    if (wallet.ownerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Fetch recent transactions
    const txs = await WT.findAll({ where: { walletId }, order: [['createdAt', 'DESC']], limit: 100 })
    return NextResponse.json(txs)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
