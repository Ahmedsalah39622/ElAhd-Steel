import { NextResponse } from 'next/server'
let sequelize

async function init() {
  if (!sequelize) {
    const modelsModule = require('../../../../../models')
    const models = await modelsModule.getDb()
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

    const body = await req.json()
    const { safeId, amount, description, incomingFrom } = body || {}
    if (!amount || Number(amount) <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

    // Auth: allow only authenticated users
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

    const SafeEntry = sequelize.models.SafeEntry

    // prepend incomingFrom into description for storage (since model has no incomingFrom field)
    const finalDescription = incomingFrom ? `${incomingFrom} — ${description || 'رصيد إضافي'}` : (description || 'رصيد إضافي')

    const entry = await SafeEntry.create({ date: new Date(), description: finalDescription, incoming: Number(amount), entryType: 'incoming', incomingMethod: 'manual-deposit', safeId: safeId || null })

    const out = entry.get({ plain: true })
    // expose incomingFrom on response for client convenience
    out.incomingFrom = incomingFrom || null

    return NextResponse.json({ success: true, entry: out })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
