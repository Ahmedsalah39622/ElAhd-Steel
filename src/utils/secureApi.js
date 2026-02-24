/**
 * Secure API Handler Wrapper
 * Provides security features for API routes including:
 * - Rate limiting
 * - Input sanitization
 * - Security headers
 * - Request logging
 *
 * @package Ahd Steel
 * @author ITTSOFT
 */

import { checkRateLimit, applySecurityHeaders, getClientIP, sanitizeObject } from './security'

/**
 * Wrap an API handler with security features
 * @param {function} handler - The API handler function
 * @param {object} options - Security options
 * @returns {function} Secured handler
 */
export const withSecurity = (handler, options = {}) => {
  const {
    rateLimit = { windowMs: 15 * 60 * 1000, max: 100 },
    sanitize = true,
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    requireAuth = false
  } = options

  return async (req, res) => {
    try {
      // Apply security headers
      applySecurityHeaders(res)

      // Check allowed methods
      if (!methods.includes(req.method)) {
        res.setHeader('Allow', methods.join(', '))

        return res.status(405).json({ error: 'Method not allowed' })
      }

      // Rate limiting
      if (rateLimit) {
        const ip = getClientIP(req)

        const rateLimitResult = checkRateLimit(ip, {
          windowMs: rateLimit.windowMs,
          max: rateLimit.max,
          prefix: `api:${req.url}`
        })

        res.setHeader('X-RateLimit-Limit', rateLimit.max)
        res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining)
        res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime)

        if (!rateLimitResult.allowed) {
          res.setHeader('Retry-After', rateLimitResult.retryAfter)

          return res.status(429).json({
            error: 'Too many requests',
            retryAfter: rateLimitResult.retryAfter
          })
        }
      }

      // Sanitize request body
      if (sanitize && req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body, {
          stripHtml: true,
          trimWhitespace: true,
          escapeSpecialChars: false, // Don't escape for database ops
          maxLength: 50000
        })
      }

      // Call the original handler
      return await handler(req, res)
    } catch (error) {
      console.error('API Security Error:', error)

      // Don't expose internal errors in production
      const isDev = process.env.NODE_ENV !== 'production'

      return res.status(500).json({
        error: isDev ? error.message : 'Internal server error',
        ...(isDev && { stack: error.stack })
      })
    }
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const rateLimitConfigs = {
  // Default API rate limit
  default: { windowMs: 15 * 60 * 1000, max: 100 },

  // Strict rate limit for authentication
  auth: { windowMs: 60 * 60 * 1000, max: 5 },

  // Relaxed rate limit for read operations
  read: { windowMs: 15 * 60 * 1000, max: 200 },

  // Strict rate limit for write operations
  write: { windowMs: 15 * 60 * 1000, max: 50 },

  // Very strict for sensitive operations
  sensitive: { windowMs: 60 * 60 * 1000, max: 10 }
}

/**
 * Log security events
 * @param {string} event - Event type
 * @param {object} details - Event details
 */
export const logSecurityEvent = (event, details = {}) => {
  const timestamp = new Date().toISOString()

  const logEntry = {
    timestamp,
    event,
    ...details
  }

  // In production, this should write to a secure log file or service
  console.log('[SECURITY]', JSON.stringify(logEntry))
}

export default withSecurity
