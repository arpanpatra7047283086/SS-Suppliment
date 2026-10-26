import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'ss_session'
function getSecret() {
  const rawSecret = process.env.AUTH_SECRET
  if (!rawSecret || rawSecret.length < 32) throw new Error('AUTH_SECRET must be configured with at least 32 characters')
  return new TextEncoder().encode(rawSecret)
}

type Session = { email: string; role: 'admin' }

export async function createSession(email: string) {
  const token = await new SignJWT({ email, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(getSecret())
  ;(await cookies()).set(COOKIE_NAME, token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (payload.role !== 'admin' || typeof payload.email !== 'string') return null
    return { email: payload.email, role: 'admin' }
  } catch { return null }
}

export async function clearSession() { (await cookies()).delete(COOKIE_NAME) }
