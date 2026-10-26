import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { createSession } from '@/lib/session'

const schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(8).max(128) })

export async function POST(request: Request) {
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }) }
  const parsed = schema.safeParse(body)
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const passwordHash = process.env.ADMIN_PASSWORD_HASH
  if (!parsed.success || !configuredEmail || !passwordHash) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  const valid = parsed.data.email === configuredEmail && await bcrypt.compare(parsed.data.password, passwordHash)
  if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  await createSession(configuredEmail)
  return NextResponse.json({ ok: true })
}
