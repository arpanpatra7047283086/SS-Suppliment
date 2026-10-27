import { randomInt } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDatabase } from '@/lib/mongodb'

const requestSchema = z.object({ email: z.string().trim().toLowerCase().email(), action: z.enum(['send', 'verify']), otp: z.string().regex(/^\d{6}$/).optional() })
const OTP_TTL_MS = Math.max(60, Number(process.env.OTP_TTL_SECONDS || 600)) * 1000
const OTP_MAX_ATTEMPTS = Math.max(1, Number(process.env.OTP_MAX_ATTEMPTS || 5))

export async function POST(request: Request) {
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const { email, action, otp } = parsed.data
  const db = await getDatabase()
  const collection = db.collection('otp_requests')

  if (action === 'send') {
    const last = await collection.findOne<{ updatedAt: Date }>({ email })
    if (last?.updatedAt && Date.now() - last.updatedAt.getTime() < 60_000) return NextResponse.json({ error: 'Please wait before requesting another code' }, { status: 429 })
    const code = String(randomInt(100000, 1000000))
    const emailApiUrl = process.env.APPS_SCRIPT_EMAIL_API_URL || process.env.OTP_EMAIL_API_URL
    if (!emailApiUrl) return NextResponse.json({ error: 'Email service is not configured' }, { status: 503 })
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)
    let response: Response
    try {
      response = await fetch(emailApiUrl, { method: 'POST', headers: { 'content-type': 'application/json', ...((process.env.APPS_SCRIPT_API_KEY || process.env.OTP_EMAIL_API_KEY) ? { authorization: `Bearer ${process.env.APPS_SCRIPT_API_KEY || process.env.OTP_EMAIL_API_KEY}` } : {}) }, body: JSON.stringify({ to: email, otp: code, template: 'otp' }), cache: 'no-store', signal: controller.signal })
    } catch {
      return NextResponse.json({ error: 'Unable to send verification code' }, { status: 502 })
    } finally {
      clearTimeout(timeout)
    }
    if (!response.ok) return NextResponse.json({ error: 'Unable to send verification code' }, { status: 502 })
    await collection.updateOne({ email }, { $set: { email, code, expiresAt: new Date(Date.now() + OTP_TTL_MS), attempts: 0, updatedAt: new Date() } }, { upsert: true })
    return NextResponse.json({ ok: true })
  }

  if (!otp) return NextResponse.json({ error: 'Verification code required' }, { status: 400 })
  const record = await collection.findOne<{ code: string; expiresAt: Date; attempts: number }>({ email })
  if (!record || record.expiresAt <= new Date() || record.attempts >= OTP_MAX_ATTEMPTS || record.code !== otp) {
    if (record) await collection.updateOne({ email }, { $inc: { attempts: 1 } })
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 })
  }
  const consumed = await collection.deleteOne({ email, code: otp, attempts: { $lt: OTP_MAX_ATTEMPTS }, expiresAt: { $gt: new Date() } })
  if (consumed.deletedCount !== 1) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 })
  return NextResponse.json({ ok: true })
}
