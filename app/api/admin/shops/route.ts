import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDatabase } from '@/lib/mongodb'
import type { Shop, User } from '@/lib/accounts'
import { getSession } from '@/lib/session'

const shopSchema = z.object({ name: z.string().trim().min(2).max(100), location: z.string().trim().min(2).max(120), address: z.string().trim().min(2).max(250), contactEmail: z.string().email().optional().or(z.literal('')), contactPhone: z.string().max(30).optional() })

async function requireAdmin() { const session = await getSession(); return session?.role === 'admin' }

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = await getDatabase()
  // Ensure the requested first branch exists as a real, assignable database record.
  await db.collection<Shop>('shops').updateOne(
    { shopId: 'haldia' },
    { $setOnInsert: { shopId: 'haldia', name: 'Haldia', location: 'Haldia, West Bengal', address: 'Haldia, West Bengal', status: 'active', createdAt: new Date(), updatedAt: new Date() } },
    { upsert: true },
  )
  const shops = await db.collection<Shop>('shops').find({ status: 'active' }).sort({ name: 1 }).toArray()
  const employees = await db.collection<User>('users').find({ role: 'employee', status: 'active' }, { projection: { name: 1, shopId: 1 } }).toArray()
  return NextResponse.json(shops.map((shop) => {
    const shopEmployees = employees.filter((employee) => employee.shopId === shop.shopId)
    return { id: shop.shopId, name: shop.name, location: shop.location, address: shop.address, employees: shopEmployees.length, manager: shopEmployees[0]?.name || 'Unassigned', sales: '—', note: shopEmployees.length ? `${shopEmployees.length} team member${shopEmployees.length === 1 ? '' : 's'} assigned to this shop.` : 'No employees assigned yet.' }
  }))
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = shopSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Enter a shop name, location, and address.' }, { status: 400 })
  const db = await getDatabase(); const now = new Date(); const shopId = `shop-${crypto.randomUUID()}`
  const shop: Shop = { shopId, ...parsed.data, status: 'active', createdAt: now, updatedAt: now }
  await db.collection<Shop>('shops').insertOne(shop)
  return NextResponse.json({ id: shopId, name: shop.name, location: shop.location, address: shop.address, employees: 0, manager: 'Unassigned', sales: '—', note: 'No employees assigned yet.' }, { status: 201 })
}
