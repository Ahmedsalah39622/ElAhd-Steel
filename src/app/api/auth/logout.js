// src/app/api/auth/logout.js
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'token'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Clear cookie
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`)
  res.status(200).json({ ok: true })
}
