/**
 * API Analytics Middleware
 *
 * Automatically tracks:
 * - Response times
 * - Status codes
 * - Error rates
 * - Request throughput
 *
 * Usage: Wrap your API route handlers with this middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { trackAPIResponse, trackServerError, trackClientError } from './analytics-service'

type APIHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse> | NextResponse

/**
 * Middleware to track API metrics
 */
export function withAPIAnalytics(handler: APIHandler): APIHandler {
  return async (request: NextRequest, context?: any) => {
    const startTime = Date.now()
    const endpoint = request.nextUrl.pathname
    const method = request.method

    try {
      // Call the actual API handler
      const response = await handler(request, context)
      const responseTime = Date.now() - startTime
      const statusCode = response.status

      // Track the response
      await trackAPIResponse({
        endpoint,
        method,
        statusCode,
        responseTime,
        success: statusCode >= 200 && statusCode < 300
      })

      // Track errors by status code
      if (statusCode >= 500) {
        await trackServerError(endpoint, statusCode, response.statusText)
      } else if (statusCode >= 400) {
        await trackClientError(endpoint, statusCode, response.statusText)
      }

      return response
    } catch (error: any) {
      const responseTime = Date.now() - startTime

      // Track the error
      await trackAPIResponse({
        endpoint,
        method,
        statusCode: 500,
        responseTime,
        success: false,
        errorMessage: error.message
      })

      await trackServerError(endpoint, 500, error.message)

      // Re-throw the error so it's handled by Next.js
      throw error
    }
  }
}

/**
 * Example usage in an API route:
 *
 * import { withAPIAnalytics } from '@/lib/api-analytics-middleware'
 *
 * export const GET = withAPIAnalytics(async (request: NextRequest) => {
 *   // Your API logic here
 *   return NextResponse.json({ success: true })
 * })
 */
