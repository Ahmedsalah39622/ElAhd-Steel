import { NextResponse } from 'next/server'
const bcrypt = require('bcryptjs')
let WalletV2, sequelize

async function init() {
  if (!WalletV2) {
    const modelsModule = require('../../../../../models')
    const models = await modelsModule.getDb()
    WalletV2 = models.WalletV2
    sequelize = models.sequelize
  }
}

function verifyTokenAndGetPayload(token) {
  try {
    const jwt = require('jsonwebtoken')
    const secret = process.env.JWT_SECRET || 'dev-jwt-secret'
    const payload = jwt.verify(token, secret)
    return payload || null
  } catch (e) { return null }
}

export async function POST(req) {
  try {
    await init()
    const body = await req.json()
    const { walletId, password } = body
    if (!walletId || !password) return NextResponse.json({ error: 'walletId and password required' }, { status: 400 })

    // extract token
    let tokenValue = null
    try { const auth = req.headers.get('authorization') || ''; if (auth && auth.startsWith('Bearer ')) tokenValue = auth.slice(7) } catch(e){}
    if (!tokenValue) {
      try { const cookieHeader = req.headers.get('cookie') || ''; const match = cookieHeader.split(';').map(c=>c.trim()).find(c=>c.startsWith('token=')); if (match) tokenValue = match.split('=')[1] } catch(e){}
    }
    if (!tokenValue) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const payload = verifyTokenAndGetPayload(tokenValue)
    if (!payload || !payload.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const User = sequelize.models.User
    const user = await User.findByPk(payload.id)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 })

    // verify password
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return NextResponse.json({ error: 'Invalid password' }, { status: 401 })

    // check ownership
    const w = await WalletV2.findOne({ where: { id: walletId, ownerId: user.id } })
    if (!w) return NextResponse.json({ error: 'Wallet not found or not owner' }, { status: 404 })

    // return wallet details if ok
    return NextResponse.json({ success: true, wallet: w })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
