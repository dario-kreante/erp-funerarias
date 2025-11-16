/**
 * Simple in-memory rate limiter for API routes
 * Note: This is suitable for single-server deployments
 * For production with multiple servers, use Redis or similar
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

interface RateLimitConfig {
  windowMs?: number // Time window in milliseconds (default: 15 minutes)
  max?: number // Maximum requests per window (default: 100)
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  retryAfter?: number // seconds until reset
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {}
): RateLimitResult {
  const { windowMs = 15 * 60 * 1000, max = 100 } = config
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    cleanupExpiredEntries()
  }

  // If no entry exists or window has expired, create new entry
  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs
    rateLimitStore.set(identifier, { count: 1, resetTime })
    return {
      success: true,
      remaining: max - 1,
      resetTime,
    }
  }

  // Check if limit exceeded
  if (entry.count >= max) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    }
  }

  // Increment counter
  entry.count++
  return {
    success: true,
    remaining: max - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Reset rate limit for a specific identifier (useful for testing)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() }),
  }
}

/**
 * Specific rate limits for different operations
 */
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits
  auth: { windowMs: 15 * 60 * 1000, max: 10 }, // 10 requests per 15 minutes
  signup: { windowMs: 60 * 60 * 1000, max: 5 }, // 5 signups per hour
  login: { windowMs: 15 * 60 * 1000, max: 10 }, // 10 login attempts per 15 minutes

  // API endpoints - moderate limits
  api: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes

  // Search/filter operations - higher limits
  search: { windowMs: 1 * 60 * 1000, max: 30 }, // 30 searches per minute

  // Data mutation operations - stricter limits
  create: { windowMs: 60 * 60 * 1000, max: 50 }, // 50 creates per hour
  update: { windowMs: 60 * 60 * 1000, max: 100 }, // 100 updates per hour
  delete: { windowMs: 60 * 60 * 1000, max: 20 }, // 20 deletes per hour
}
