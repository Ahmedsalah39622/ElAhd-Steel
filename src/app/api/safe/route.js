export const dynamic = 'force-dynamic'

import handler from './safe.js'
import { checkAuth } from '@/utils/auth'

export async function GET(request) {
  // Check authentication
  const auth = checkAuth(request)
  if (!auth.authenticated) return auth.response

  // No body for GET
  const req = { method: 'GET', query: {}, user: auth.user }
  let status = 200
  const headerMap = {}
  const res = {
    status(code) {
      status = code
      return this
    },
    setHeader(name, value) {
      headerMap[name.toLowerCase()] = value
      return this
    },
    json(payload) {
      const headers = Object.assign({}, headerMap)
      headers['content-type'] = headers['content-type'] || 'application/json'
      return new Response(JSON.stringify(payload), { status, headers })
    }
  }

  try {
    const result = await handler(req, res)
    if (result instanceof Response) return result
    return new Response(null, { status })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
  }
}

export async function POST(request) {
  // Check authentication
  const auth = checkAuth(request)
  if (!auth.authenticated) return auth.response

  const body = await request.json().catch(() => ({}))
  const req = { method: 'POST', body, user: auth.user }

  let status = 200
  const headerMap = {}
  const res = {
    status(code) {
      status = code
      return this
    },
    setHeader(name, value) {
      headerMap[name.toLowerCase()] = value
      return this
    },
    json(payload) {
      const headers = Object.assign({}, headerMap)
      headers['content-type'] = headers['content-type'] || 'application/json'
      return new Response(JSON.stringify(payload), { status, headers })
    }
  }

  try {
    const result = await handler(req, res)
    if (result instanceof Response) return result
    return new Response(null, { status })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
  }
}
