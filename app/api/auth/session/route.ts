import { NextResponse } from 'next/server'
import { clearSession, getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  return NextResponse.json({ authenticated: Boolean(session), session: session ? { email: session.email, role: session.role } : null })
}

export async function DELETE() {
  await clearSession()
  return NextResponse.json({ ok: true })
}
