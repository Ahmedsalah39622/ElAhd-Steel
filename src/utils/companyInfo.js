/**
 * Centralized company information — reads from NEXT_PUBLIC_COMPANY_* env vars
 * set by the AHD-Configurator. Provides sensible fallbacks.
 */

export const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Ahd Steel'
export const COMPANY_ADDRESS = process.env.NEXT_PUBLIC_COMPANY_ADDRESS || ''
export const COMPANY_PHONE = process.env.NEXT_PUBLIC_COMPANY_PHONE || ''
export const COMPANY_EMAIL = process.env.NEXT_PUBLIC_COMPANY_EMAIL || ''

// Logo paths — the Configurator copies the logo to company-logo.png.
// We try that first, then fall back to the legacy hardcoded filename.
export const COMPANY_LOGO = '/images/logos/company-logo.png'
export const COMPANY_LOGO_FALLBACK = '/images/logos/IMG-20251228-WA0005-removebg-preview.png'

/**
 * Build a simple SVG text logo as a data URI (used when no image is available).
 */
export function buildFallbackLogoDataUri(name) {
  const label = name || COMPANY_NAME
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='64'><rect width='100%' height='100%' fill='#1976d2'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='20' fill='white'>${label}</text></svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}
