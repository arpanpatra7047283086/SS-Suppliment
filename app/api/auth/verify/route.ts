import { createHash, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSession, type Session } from '@/lib/session'
import { getDatabase } from '@/lib/mongodb'
import { writeAudit } from '@/lib/audit'

const bodySchema = z.object({ transactionId: z.string().uuid(), otp: z.string().regex(/^\d{6}$/) })
const hashOtp = (transactionId: string, otp: string) => createHash('sha256').update(`${transactionId}:${otp}:${process.env.AUTH_SECRET || ''}`).digest('hex')

export async function POST(request: Request) {
  let input: unknown
  try { input = await request.json() } catch { return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 401 }) }
  const parsed = bodySchema.safeParse(input)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 401 })
  const collection = (await getDatabase()).collection<{ transactionId: string; email: string; session: Session; otpHash: string; attempts: number; maxAttempts: number; expiresAt: Date }>('login_otps')
  const record = await collection.findOne({ transactionId: parsed.data.transactionId })
  if (!record || record.expiresAt <= new Date() || record.attempts >= record.maxAttempts) return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 401 })
  const expected = Buffer.from(record.otpHash, 'hex')
  const actual = Buffer.from(hashOtp(record.transactionId, parsed.data.otp), 'hex')
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    await collection.updateOne({ transactionId: record.transactionId }, { $inc: { attempts: 1 } })
    return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 401 })
  }
  const consumed = await collection.deleteOne({ transactionId: record.transactionId, otpHash: record.otpHash })
  if (consumed.deletedCount !== 1) return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 401 })
  await createSession(record.session)
  await writeAudit('auth.login', record.session)
  return NextResponse.json({ ok: true, role: record.session.role, destination: record.session.role === 'admin' ? '/admin' : '/shop' })
}
