// Authentication utility for API routes
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret'
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'token'

/**
 * Verify JWT token from request
 * @param {Object} req - Request object (Next.js API or pages API)
 * @returns {Object|null} - Decoded user payload or null if invalid
 */
export function verifyToken(req) {
  try {
    let token = null

    // Try to get token from cookies (pages API)
    if (req.cookies && req.cookies[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME]
    } else if (req.headers) {
      // Try to get from cookie header string (app router)
      const cookieHeader = req.headers.get ? req.headers.get('cookie') : req.headers.cookie

      if (cookieHeader) {
        const cookies = parseCookies(cookieHeader)

        token = cookies[COOKIE_NAME]
      }
    }

    // Also check Authorization header as fallback
    if (!token) {
      const authHeader = req.headers?.get ? req.headers.get('authorization') : req.headers?.authorization

      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7)
      }
    }

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, JWT_SECRET)

    return decoded
  } catch (err) {
    console.error('[auth] Token verification failed:', err.message)

    return null
  }
}

/**
 * Middleware wrapper for protected API routes (pages/api)
 * @param {Function} handler - The API route handler
 * @returns {Function} - Wrapped handler that checks authentication
 */
export function withAuth(handler) {
  return async (req, res) => {
    const user = verifyToken(req)

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized - Please login' })
    }

    // Attach user to request for use in handler
    req.user = user

    return handler(req, res)
  }
}

/**
 * Check auth for App Router API routes
 * @param {Request} request - Fetch API Request object
 * @returns {Object} - { authenticated: boolean, user: object|null, response?: Response }
 */
export function checkAuth(request) {
  const user = verifyToken(request)

  if (!user) {
    return {
      authenticated: false,
      user: null,
      response: new Response(JSON.stringify({ error: 'Unauthorized - Please login' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      })
    }
  }

  return { authenticated: true, user }
}

/**
 * Parse cookie header string into object
 */
function parseCookies(cookieHeader) {
  const cookies = {}

  if (!cookieHeader) return cookies

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=')

    if (name) {
      cookies[name] = rest.join('=')
    }
  })

  return cookies
}

// CommonJS export for pages/api routes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { verifyToken, withAuth, checkAuth }
}
