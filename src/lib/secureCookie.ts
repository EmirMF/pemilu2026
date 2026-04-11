import crypto from 'crypto'

const COOKIE_SECRET = process.env.COOKIE_SECRET

if (!COOKIE_SECRET) {
  throw new Error('COOKIE_SECRET environment variable is required')
}

export function signCookie(value: string): string {
  const signature = crypto
    .createHmac('sha256', COOKIE_SECRET)
    .update(value)
    .digest('hex')
  
  // Use | as delimiter instead of . to avoid conflicts with email addresses
  return `${value}|${signature}`
}

export function verifyCookie(signedValue: string): string | null {
  // Use | as delimiter
  const lastPipeIndex = signedValue.lastIndexOf('|')
  if (lastPipeIndex === -1) {
    return null
  }
  
  const value = signedValue.substring(0, lastPipeIndex)
  const signature = signedValue.substring(lastPipeIndex + 1)
  
  const expectedSignature = crypto
    .createHmac('sha256', COOKIE_SECRET)
    .update(value)
    .digest('hex')
  
  // Constant-time comparison
  try {
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return value
    }
  } catch {
    return null
  }
  
  return null
}
