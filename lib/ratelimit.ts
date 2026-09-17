/**
 * Simple in-memory rate limiting
 * For production, consider using Upstash Redis or Vercel KV
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed within the window
   */
  limit: number
  /**
   * Time window in milliseconds
   */
  window: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Rate limiter with sliding window
 *
 * @param identifier - User ID or IP address
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function ratelimit(
  identifier: string,
  config: RateLimitConfig = { limit: 10, window: 60 * 1000 } // 10 requests per minute default
): RateLimitResult {
  const now = Date.now()
  const key = `ratelimit:${identifier}`

  // Get or create entry
  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 0,
      resetTime: now + config.window
    }
  }

  // Increment count
  store[key].count++

  const success = store[key].count <= config.limit
  const remaining = Math.max(0, config.limit - store[key].count)
  const reset = store[key].resetTime

  return {
    success,
    limit: config.limit,
    remaining,
    reset
  }
}

/**
 * AI-specific rate limits
 */
export const AI_RATE_LIMITS = {
  // Bio enhancement: 5 per hour per user
  bioEnhancement: {
    limit: 5,
    window: 60 * 60 * 1000
  },
  // Opportunity matching: 20 per hour per user
  opportunityMatch: {
    limit: 20,
    window: 60 * 60 * 1000
  },
  // Conversation starters: 10 per hour per user
  conversationStarters: {
    limit: 10,
    window: 60 * 60 * 1000
  },
  // Smart recommendations: 30 per hour per user
  smartRecommendations: {
    limit: 30,
    window: 60 * 60 * 1000
  }
} as const
