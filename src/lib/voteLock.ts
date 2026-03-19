import redis from './redis'

/**
 * Distributed lock for voting to prevent race conditions
 * Uses Redis SET with NX (only set if not exists) and EX (expiry)
 */
export async function acquireVoteLock(nim: string, ttlSeconds: number = 10): Promise<boolean> {
  const key = `vote-lock:${nim}`
  
  try {
    // SET key value EX seconds NX
    // Returns 'OK' if lock acquired, null if already exists
    const result = await redis.set(key, '1', 'EX', ttlSeconds, 'NX')
    return result === 'OK'
  } catch (error) {
    console.error('Vote lock acquisition error:', error)
    return false
  }
}

/**
 * Release the vote lock
 */
export async function releaseVoteLock(nim: string): Promise<void> {
  const key = `vote-lock:${nim}`
  
  try {
    await redis.del(key)
  } catch (error) {
    console.error('Vote lock release error:', error)
  }
}
