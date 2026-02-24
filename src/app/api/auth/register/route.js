export const dynamic = 'force-dynamic'

import handler from '../register.js'

export async function POST(request) {
  const body = await request.json().catch(() => ({}))

  // Build minimal Express-like req/res objects for the existing handler
  const req = { method: 'POST', body }

  let status = 200
  const headerMap = {}
  const res = {
    status(code) {
      status = code
      return this
    },
    setHeader(name, value) {
      const k = name.toLowerCase()
      if (k === 'set-cookie') {
        if (!headerMap[k]) headerMap[k] = []
        headerMap[k].push(value)
      } else {
        headerMap[k] = value
      }
      return this
    },
    json(payload) {
      const headers = Object.assign({}, headerMap)
      headers['content-type'] = headers['content-type'] || 'application/json'
      return new Response(JSON.stringify(payload), {
        status,
        headers
      })
    }
  }

  // Call existing handler
  try {
    const result = await handler(req, res)
    // If handler returned a Response directly, forward it
    if (result instanceof Response) return result
    // Otherwise handlers use res.json to return; nothing to do
    return new Response(null, { status })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
  }
}
