import { NextResponse } from 'next/server'
let WalletV2, WT, sequelize

async function init() {
  if (!WalletV2) {
    const modelsModule = require('@models')
    const models = await modelsModule.getDb()
    WalletV2 = models.WalletV2
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

    // auth via cookie or bearer
    let currentEmail = null
    try {
      const authHeader = req.headers.get('authorization') || ''
      if (authHeader && authHeader.startsWith('Bearer ')) currentEmail = verifyTokenAndGetEmail(authHeader.slice(7))
    } catch (e) {}
    if (!currentEmail) {
      try {
        const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'token'
        const cookieHeader = req.headers.get('cookie') || ''
        const match = cookieHeader
          .split(';')
          .map(c => c.trim())
          .find(c => c.startsWith(`${COOKIE_NAME}=`))
        if (match) currentEmail = verifyTokenAndGetEmail(match.split('=')[1])
      } catch (e) {}
    }
    if (!currentEmail) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const User = sequelize.models.User
    const user = await User.findOne({ where: { email: currentEmail } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 })

    const w = await WalletV2.findByPk(walletId)
    if (!w) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    if (w.ownerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const txs = await WT.findAll({ where: { walletId }, order: [['createdAt', 'DESC']], limit: 200 })
    return NextResponse.json(txs)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
