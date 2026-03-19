import redis from './redis'

type RateLimitConfig = {
  interval: number // in seconds
  maxRequests: number
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = { interval: 60, maxRequests: 5 }
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const key = `ratelimit:${identifier}`
  const now = Date.now()
  
  try {
    const current = await redis.get(key)
    
    if (!current) {
      // First request
      await redis.set(key, JSON.stringify({ count: 1, resetAt: now + config.interval * 1000 }), 'EX', config.interval)
      return { success: true, remaining: config.maxRequests - 1, resetAt: now + config.interval * 1000 }
    }
    
    const data = JSON.parse(current)
    
    if (data.count >= config.maxRequests) {
      return { success: false, remaining: 0, resetAt: data.resetAt }
    }
    
    // Increment count
    data.count += 1
    const ttl = await redis.ttl(key)
    await redis.set(key, JSON.stringify(data), 'EX', ttl > 0 ? ttl : config.interval)
    
    return { success: true, remaining: config.maxRequests - data.count, resetAt: data.resetAt }
  } catch (error) {
    console.error('Rate limit error:', error)
    // Fail open - allow request if rate limiting fails
    return { success: true, remaining: config.maxRequests, resetAt: now + config.interval * 1000 }
  }
}
