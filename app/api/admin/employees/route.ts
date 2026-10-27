import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createEmployee } from '@/lib/accounts'
import type { Shop } from '@/lib/accounts'
import { getDatabase } from '@/lib/mongodb'
import { getSession } from '@/lib/session'

const employeeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(30).optional(),
  password: z.string().min(8).max(128),
  shopId: z.string().trim().min(1).max(80),
})

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = employeeSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Enter a name, email, shop and password of at least 8 characters.' }, { status: 400 })
  try {
    const shop = await getDatabase().then((db) => db.collection<Shop>('shops').findOne({ shopId: parsed.data.shopId, status: 'active' }))
    if (!shop) return NextResponse.json({ error: 'Select an active shop before creating the employee.' }, { status: 400 })
    const employee = await createEmployee({ ...parsed.data, role: 'employee', permissions: ['shop:read', 'products:read'], status: 'active' })
    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_EXISTS') return NextResponse.json({ error: 'An account already uses this email.' }, { status: 409 })
    console.error('Employee creation failed', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Could not create the employee account. Check your MongoDB connection and try again.' }, { status: 500 })
  }
}

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const users = await getDatabase().then((db) => db.collection('users').find({ role: 'employee', status: 'active' }, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).limit(6).toArray())
  return NextResponse.json(users.map(({ _id, ...user }) => ({ id: _id.toString(), ...user })))
}
