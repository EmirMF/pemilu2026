import { cookies } from 'next/headers'
import crypto from 'crypto'

const CSRF_SECRET = process.env.CSRF_SECRET

if (!CSRF_SECRET) {
  throw new Error('CSRF_SECRET environment variable is required')
}

export async function generateCSRFToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const cookieStore = await cookies()
  
  // Set CSRF token in httpOnly cookie
  cookieStore.set('csrf_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 // 1 hour
  })
  
  return token
}

export async function verifyCSRFToken(token: string): Promise<boolean> {
  const cookieStore = await cookies()
  const storedToken = cookieStore.get('csrf_token')?.value
  
  if (!storedToken || !token) {
    return false
  }
  
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(storedToken),
    Buffer.from(token)
  )
}
