import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'ss_session'
export type Role = 'admin' | 'employee'
export type Session = { userId: string; email: string; role: Role; shopId?: string }

function getSecret() {
  const rawSecret = process.env.AUTH_SECRET || process.env.SECRET_KEY || process.env.DJANGO_SECRET_KEY
  if (!rawSecret || rawSecret.length < 32) throw new Error('AUTH_SECRET must be configured with at least 32 characters')
  return new TextEncoder().encode(rawSecret)
}

export async function createSession(session: Session) {
  const token = await new SignJWT(session).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('8h').sign(getSecret())
  ;(await cookies()).set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 8 })
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if ((payload.role !== 'admin' && payload.role !== 'employee') || typeof payload.email !== 'string' || typeof payload.userId !== 'string') return null
    return { userId: payload.userId, email: payload.email, role: payload.role, ...(typeof payload.shopId === 'string' ? { shopId: payload.shopId } : {}) }
  } catch { return null }
}

export async function clearSession() { (await cookies()).delete(COOKIE_NAME) }
