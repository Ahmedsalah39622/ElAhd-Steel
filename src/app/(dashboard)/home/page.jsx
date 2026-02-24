import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import Dashboard from '@/views/dashboard/Dashboard'

const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret'

export default async function Page() {
  // Server-side auth: read token from cookies and verify
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/login?from=/home')
  }

  let payload

  try {
    payload = jwt.verify(token, JWT_SECRET)
  } catch (e) {
    redirect('/login?from=/home')
  }

  return <Dashboard />
}
