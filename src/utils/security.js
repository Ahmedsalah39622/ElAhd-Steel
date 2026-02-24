/**
 * Security Utilities for Ahd Steel Management System
 * Provides comprehensive security functions for input sanitization,
 * rate limiting, CSRF protection, and more.
 *
 * @package Ahd Steel
 * @author ITTSOFT
 * @version 1.0.0
 */

// =============================================================================
// INPUT SANITIZATION
// =============================================================================

/**
 * Sanitize user input to prevent XSS and injection attacks
 * @param {string} input - The input string to sanitize
 * @param {object} options - Sanitization options
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input, options = {}) => {
  if (input === null || input === undefined) return ''
  if (typeof input !== 'string') return String(input)

  const {
    stripHtml = true,
    trimWhitespace = true,
    escapeSpecialChars = true,
    maxLength = 10000,
    allowedTags = []
  } = options

  let sanitized = input

  // Trim whitespace
  if (trimWhitespace) {
    sanitized = sanitized.trim()
  }

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  // Strip HTML tags (except allowed)
  if (stripHtml) {
    if (allowedTags.length === 0) {
      sanitized = sanitized.replace(/<[^>]*>/g, '')
    } else {
      const allowedPattern = allowedTags.map(tag => `<${tag}[^>]*>|</${tag}>`).join('|')
      const regex = new RegExp(`(?!${allowedPattern})<[^>]*>`, 'gi')

      sanitized = sanitized.replace(regex, '')
    }
  }

  // Escape special characters for XSS prevention
  if (escapeSpecialChars) {
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  return sanitized
}

/**
 * Sanitize an object recursively
 * @param {object} obj - The object to sanitize
 * @param {object} options - Sanitization options
 * @returns {object} Sanitized object
 */
export const sanitizeObject = (obj, options = {}) => {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return sanitizeInput(String(obj), options)

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, options))
  }

  const sanitized = {}

  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeInput(key, { ...options, escapeSpecialChars: false })

    if (typeof value === 'object' && value !== null) {
      sanitized[sanitizedKey] = sanitizeObject(value, options)
    } else if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeInput(value, options)
    } else {
      sanitized[sanitizedKey] = value
    }
  }

  return sanitized
}

// =============================================================================
// RATE LIMITING
// =============================================================================

// In-memory store for rate limiting (use Redis in production for multi-server)
const rateLimitStore = new Map()

/**
 * Clean expired entries from rate limit store
 */
const cleanRateLimitStore = () => {
  const now = Date.now()

  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Clean store every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanRateLimitStore, 5 * 60 * 1000)
}

/**
 * Rate limit checker
 * @param {string} identifier - Unique identifier (IP, user ID, etc.)
 * @param {object} options - Rate limiting options
 * @returns {object} { allowed: boolean, remaining: number, resetTime: number }
 */
export const checkRateLimit = (identifier, options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // 100 requests per window
    prefix = 'rl'
  } = options

  const key = `${prefix}:${identifier}`
  const now = Date.now()

  let data = rateLimitStore.get(key)

  if (!data || now > data.resetTime) {
    data = {
      count: 0,
      resetTime: now + windowMs
    }
  }

  data.count++
  rateLimitStore.set(key, data)

  const remaining = Math.max(0, max - data.count)
  const allowed = data.count <= max

  return {
    allowed,
    remaining,
    resetTime: data.resetTime,
    retryAfter: Math.ceil((data.resetTime - now) / 1000)
  }
}

/**
 * Rate limit middleware for API routes
 * @param {object} options - Rate limiting options
 * @returns {function} Middleware function
 */
export const rateLimitMiddleware = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests, please try again later',
    keyGenerator = req => req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'
  } = options

  return async (req, res, next) => {
    const identifier = keyGenerator(req)
    const result = checkRateLimit(identifier, { windowMs, max })

    res.setHeader('X-RateLimit-Limit', max)
    res.setHeader('X-RateLimit-Remaining', result.remaining)
    res.setHeader('X-RateLimit-Reset', result.resetTime)

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter)

      return res.status(429).json({ error: message })
    }

    if (typeof next === 'function') {
      return next()
    }

    return true
  }
}

// =============================================================================
// CSRF PROTECTION
// =============================================================================

import crypto from 'crypto'

/**
 * Generate a CSRF token
 * @returns {string} CSRF token
 */
export const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Validate CSRF token
 * @param {string} token - Token from request
 * @param {string} storedToken - Token from session/cookie
 * @returns {boolean} Is valid
 */
export const validateCSRFToken = (token, storedToken) => {
  if (!token || !storedToken) return false
  if (token.length !== storedToken.length) return false

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(storedToken))
}

// =============================================================================
// PASSWORD VALIDATION
// =============================================================================

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} { valid: boolean, errors: string[] }
 */
export const validatePasswordStrength = password => {
  const errors = []

  if (!password || password.length < 8) {
    errors.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('يجب أن تحتوي على حرف كبير واحد على الأقل')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('يجب أن تحتوي على حرف صغير واحد على الأقل')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('يجب أن تحتوي على رقم واحد على الأقل')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('يجب أن تحتوي على رمز خاص واحد على الأقل')
  }

  // Check for common passwords
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome']

  if (commonPasswords.some(p => password.toLowerCase().includes(p))) {
    errors.push('كلمة المرور شائعة جداً، اختر كلمة مرور أقوى')
  }

  return {
    valid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  }
}

/**
 * Calculate password strength score
 * @param {string} password - Password to check
 * @returns {string} Strength level: 'weak' | 'medium' | 'strong' | 'very-strong'
 */
const calculatePasswordStrength = password => {
  if (!password) return 'weak'

  let score = 0

  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 2

  if (score <= 3) return 'weak'
  if (score <= 5) return 'medium'
  if (score <= 7) return 'strong'

  return 'very-strong'
}

// =============================================================================
// INPUT VALIDATION
// =============================================================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const validateEmail = email => {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  return emailRegex.test(email)
}

/**
 * Validate phone number (Egyptian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Is valid phone
 */
export const validatePhone = phone => {
  if (!phone) return false

  // Egyptian mobile: 01xxxxxxxxx or +201xxxxxxxxx
  const phoneRegex = /^(\+20|0)?1[0-2,5][0-9]{8}$/

  return phoneRegex.test(phone.replace(/[\s-]/g, ''))
}

/**
 * Validate that input is a safe integer
 * @param {any} value - Value to check
 * @returns {boolean} Is safe integer
 */
export const validateSafeInteger = value => {
  const num = Number(value)

  return Number.isSafeInteger(num)
}

/**
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} Is valid UUID
 */
export const validateUUID = uuid => {
  if (!uuid) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  return uuidRegex.test(uuid)
}

// =============================================================================
// SECURITY HEADERS
// =============================================================================

/**
 * Get security headers for responses
 * @param {object} options - Header options
 * @returns {object} Security headers object
 */
export const getSecurityHeaders = (options = {}) => {
  const { isDevelopment = process.env.NODE_ENV !== 'production', allowFraming = false, customCSP = null } = options

  const csp =
    customCSP ||
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')

  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': csp
  }

  // Frame protection
  if (!allowFraming) {
    headers['X-Frame-Options'] = 'DENY'
  }

  // HSTS (only in production)
  if (!isDevelopment) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
  }

  return headers
}

/**
 * Apply security headers to response
 * @param {object} res - Response object
 * @param {object} options - Header options
 */
export const applySecurityHeaders = (res, options = {}) => {
  const headers = getSecurityHeaders(options)

  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value)
  }
}

// =============================================================================
// IP VALIDATION & BLOCKING
// =============================================================================

// Blocked IPs store (in production, use Redis or database)
const blockedIPs = new Set()

/**
 * Check if IP is blocked
 * @param {string} ip - IP address to check
 * @returns {boolean} Is blocked
 */
export const isIPBlocked = ip => {
  return blockedIPs.has(ip)
}

/**
 * Block an IP address
 * @param {string} ip - IP address to block
 * @param {number} durationMs - Block duration in milliseconds (0 = permanent)
 */
export const blockIP = (ip, durationMs = 0) => {
  blockedIPs.add(ip)

  if (durationMs > 0) {
    setTimeout(() => {
      blockedIPs.delete(ip)
    }, durationMs)
  }
}

/**
 * Unblock an IP address
 * @param {string} ip - IP address to unblock
 */
export const unblockIP = ip => {
  blockedIPs.delete(ip)
}

/**
 * Get client IP from request
 * @param {object} req - Request object
 * @returns {string} Client IP address
 */
export const getClientIP = req => {
  const forwarded = req.headers['x-forwarded-for']

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  return req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown'
}

// =============================================================================
// ENCRYPTION UTILITIES
// =============================================================================

const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * Encrypt sensitive data
 * @param {string} text - Text to encrypt
 * @param {string} key - Encryption key (32 bytes for AES-256)
 * @returns {string} Encrypted text (base64)
 */
export const encrypt = (text, key) => {
  if (!key || key.length !== 32) {
    throw new Error('Encryption key must be 32 characters')
  }

  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')

  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // Combine IV + Auth Tag + Encrypted data
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')])

  return combined.toString('base64')
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedText - Encrypted text (base64)
 * @param {string} key - Decryption key
 * @returns {string} Decrypted text
 */
export const decrypt = (encryptedText, key) => {
  if (!key || key.length !== 32) {
    throw new Error('Decryption key must be 32 characters')
  }

  const combined = Buffer.from(encryptedText, 'base64')

  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv)

  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, undefined, 'utf8')

  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Hash data using SHA-256
 * @param {string} data - Data to hash
 * @returns {string} Hashed data (hex)
 */
export const hashData = data => {
  return crypto.createHash('sha256').update(data).digest('hex')
}

// =============================================================================
// SECURE RANDOM
// =============================================================================

/**
 * Generate secure random string
 * @param {number} length - Length of string
 * @param {string} charset - Character set to use
 * @returns {string} Random string
 */
export const generateSecureRandom = (length = 32, charset = 'alphanumeric') => {
  const charsets = {
    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    numeric: '0123456789',
    hex: '0123456789abcdef',
    base64: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  }

  const chars = charsets[charset] || charsets.alphanumeric
  const randomBytes = crypto.randomBytes(length)
  let result = ''

  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length]
  }

  return result
}

// =============================================================================
// EXPORT DEFAULT SECURITY CONFIG
// =============================================================================

export const securityConfig = {
  rateLimit: {
    api: { windowMs: 15 * 60 * 1000, max: 100 },
    login: { windowMs: 60 * 60 * 1000, max: 5 },
    register: { windowMs: 60 * 60 * 1000, max: 3 }
  },
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  },
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
}

export default {
  sanitizeInput,
  sanitizeObject,
  checkRateLimit,
  rateLimitMiddleware,
  generateCSRFToken,
  validateCSRFToken,
  validatePasswordStrength,
  validateEmail,
  validatePhone,
  validateSafeInteger,
  validateUUID,
  getSecurityHeaders,
  applySecurityHeaders,
  isIPBlocked,
  blockIP,
  unblockIP,
  getClientIP,
  encrypt,
  decrypt,
  hashData,
  generateSecureRandom,
  securityConfig
}
