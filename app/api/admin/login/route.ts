import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'Use /api/auth/login to begin secure sign in.' }, { status: 410 })
}
