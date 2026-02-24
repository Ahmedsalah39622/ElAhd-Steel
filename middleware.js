import { NextResponse } from 'next/server'

// Simple in-memory rate limit for middleware (basic protection)
const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 60 // 60 requests per minute

function checkRateLimit(ip) {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: MAX_REQUESTS - 1 }
  }

  record.count++
  const remaining = Math.max(0, MAX_REQUESTS - record.count)

  return { allowed: record.count <= MAX_REQUESTS, remaining }
}

// Clean old entries periodically
setInterval(
  () => {
    const now = Date.now()
    for (const [ip, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(ip)
      }
    }
  },
  5 * 60 * 1000
) // Every 5 minutes

export async function middleware(req) {
  const { pathname } = req.nextUrl

  // Get client IP
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip || 'unknown'

  // Apply rate limiting
  const rateLimit = checkRateLimit(ip)

  if (!rateLimit.allowed) {
    return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
        'X-RateLimit-Remaining': '0'
      }
    })
  }

  // Allow public and static routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/reset-password' ||
    pathname.includes('.')
  ) {
    const res = NextResponse.next()
    // Security & debug headers
    res.headers.set('x-middleware-active', '1')
    res.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining))
    return res
  }

  // Check for auth token cookie
  const token = req.cookies.get('token')?.value

  if (!token) {
    const loginUrl = new URL('/login', req.url)
    // preserve original path to return after login if desired
    loginUrl.searchParams.set('from', pathname)
    const r = NextResponse.redirect(loginUrl)
    r.headers.set('x-middleware-redirect', '1')
    return r
  }

  // We no longer call /api/auth/me from middleware.
  // If a `token` cookie exists, allow the request to continue.
  // Server-side pages that need the authenticated user should verify the JWT themselves.

  const res = NextResponse.next()
  res.headers.set('x-middleware-active', '1')
  res.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining))
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|images|static|login|register|reset-password).*)']
}
