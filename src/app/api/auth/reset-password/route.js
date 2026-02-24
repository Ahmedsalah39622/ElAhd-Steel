export const dynamic = 'force-dynamic'

import handler from '../reset-password.js'

export async function POST(request) {
  const body = await request.json().catch(() => ({}))

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
