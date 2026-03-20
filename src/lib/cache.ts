import redis from './redis'

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  prefix?: string
}

/**
 * Get cached data from Redis
 */
export async function getCache<T>(key: string, prefix = ''): Promise<T | null> {
  try {
    const fullKey = prefix ? `${prefix}:${key}` : key
    const cached = await redis.get(fullKey)
    
    if (!cached) return null
    
    return JSON.parse(cached) as T
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

/**
 * Set data in Redis cache
 */
export async function setCache<T>(
  key: string,
  data: T,
  options: CacheOptions = {}
): Promise<boolean> {
  try {
    const { ttl = 60, prefix = '' } = options
    const fullKey = prefix ? `${prefix}:${key}` : key
    const serialized = JSON.stringify(data)
    
    if (ttl > 0) {
      await redis.setex(fullKey, ttl, serialized)
    } else {
      await redis.set(fullKey, serialized)
    }
    
    return true
  } catch (error) {
    console.error('Cache set error:', error)
    return false
  }
}

/**
 * Delete cached data
 */
export async function deleteCache(key: string, prefix = ''): Promise<boolean> {
  try {
    const fullKey = prefix ? `${prefix}:${key}` : key
    await redis.del(fullKey)
    return true
  } catch (error) {
    console.error('Cache delete error:', error)
    return false
  }
}

/**
 * Delete multiple cached keys by pattern
 */
export async function deleteCachePattern(pattern: string): Promise<boolean> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
    return true
  } catch (error) {
    console.error('Cache delete pattern error:', error)
    return false
  }
}

/**
 * Get or set cache with fallback function
 */
export async function getCacheOrSet<T>(
  key: string,
  fallback: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { prefix = '' } = options
  
  // Try to get from cache
  const cached = await getCache<T>(key, prefix)
  if (cached !== null) {
    return cached
  }
  
  // If not in cache, execute fallback
  const data = await fallback()
  
  // Store in cache
  await setCache(key, data, options)
  
  return data
}
