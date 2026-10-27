import { createHash, randomInt, randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { accountSession, verifyAccount } from '@/lib/accounts'
import { getDatabase } from '@/lib/mongodb'

const bodySchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(8).max(128) })
const ttlMs = Math.max(60, Number(process.env.OTP_TTL_SECONDS || 600)) * 1000
const maxAttempts = Math.max(1, Number(process.env.OTP_MAX_ATTEMPTS || 5))
const hashOtp = (transactionId: string, otp: string) => createHash('sha256').update(`${transactionId}:${otp}:${process.env.AUTH_SECRET || ''}`).digest('hex')

export async function POST(request: Request) {
  try {
    let input: unknown
    try { input = await request.json() } catch { return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 }) }
    const parsed = bodySchema.safeParse(input)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    const account = await verifyAccount(parsed.data.email, parsed.data.password)
    if (!account) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

    const db = await getDatabase()
    const existing = await db.collection('login_otps').findOne<{ createdAt: Date }>({ email: account.email })
    if (existing && Date.now() - existing.createdAt.getTime() < 60_000) return NextResponse.json({ error: 'Please wait before requesting another code' }, { status: 429 })

    const transactionId = randomUUID()
    const otp = String(randomInt(100000, 1_000_000))
    const endpoint = process.env.APPS_SCRIPT_EMAIL_API_URL || process.env.OTP_EMAIL_API_URL
    const apiKey = process.env.APPS_SCRIPT_API_KEY || process.env.OTP_EMAIL_API_KEY
    if (!endpoint || !apiKey) return NextResponse.json({ error: 'Email verification is not configured' }, { status: 503 })
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)
    try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ api_key: apiKey, recipient: account.email, otp, purpose: 'login_verification' }), cache: 'no-store', signal: controller.signal })
    let result: { success?: boolean } | null = null
    try { result = await response.json() } catch { /* invalid response is handled below */ }
    if (!response.ok || result?.success !== true) return NextResponse.json({ error: 'Unable to send verification code' }, { status: 502 })
    } catch { return NextResponse.json({ error: 'Unable to send verification code' }, { status: 502 }) } finally { clearTimeout(timeout) }

    await db.collection('login_otps').deleteMany({ email: account.email })
    await db.collection('login_otps').insertOne({ transactionId, email: account.email, session: accountSession(account), otpHash: hashOtp(transactionId, otp), attempts: 0, maxAttempts, createdAt: new Date(), expiresAt: new Date(Date.now() + ttlMs) })
    return NextResponse.json({ ok: true, transactionId, expiresIn: Math.floor(ttlMs / 1000) })
  } catch (error) {
    console.error('Sign-in request failed', {
      name: error instanceof Error ? error.name : 'UnknownError',
      code: typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined,
    })
    return NextResponse.json({ error: 'The database is temporarily unavailable. Please check the MongoDB Atlas connection and try again.' }, { status: 503 })
  }
}
