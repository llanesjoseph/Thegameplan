/**
 * CORS Helper
 * Validates origins against allowlist
 */

export function getAllowedOrigin(requestOrigin: string | null): string | null {
  const origin = requestOrigin || ''
  
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://athleap.crucibleanalytics.dev',
    process.env.NEXT_PUBLIC_APP_URL || '',
    process.env.NEXT_PUBLIC_BASE_URL || '',
  ].filter(Boolean)

  if (allowedOrigins.includes(origin)) {
    return origin
  }

  return null
}

export function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
  }

  const allowedOrigin = getAllowedOrigin(requestOrigin)
  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  return headers
}
