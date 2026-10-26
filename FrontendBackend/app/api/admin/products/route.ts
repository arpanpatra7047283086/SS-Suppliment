import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import { createProduct, listProducts } from '@/lib/products'

const schema = z.object({ name: z.string().min(2), slug: z.string().min(2), category: z.string().min(2), description: z.string().min(5), price: z.number().nonnegative(), stock: z.number().int().nonnegative(), imageUrl: z.string().url().optional() })
export async function GET() { if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); return NextResponse.json(await listProducts()) }
export async function POST(request: Request) { if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: 'Invalid product' }, { status: 400 }); return NextResponse.json(await createProduct(parsed.data), { status: 201 }) }
