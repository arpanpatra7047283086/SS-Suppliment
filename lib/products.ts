import { ObjectId } from 'mongodb'
import { getDatabase } from './mongodb'

export type Product = { _id?: ObjectId; name: string; slug: string; category: string; description: string; price: number; stock: number; imageUrl?: string; createdAt: Date; updatedAt: Date }

export async function listProducts() {
  const db = await getDatabase()
  const products = await db.collection<Product>('products').find({}).sort({ createdAt: -1 }).toArray()
  return products.map(({ _id, ...product }) => ({ id: _id?.toString(), ...product }))
}

export async function createProduct(input: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDatabase()
  const now = new Date()
  const result = await db.collection<Product>('products').insertOne({ ...input, createdAt: now, updatedAt: now })
  return { id: result.insertedId.toString(), ...input, createdAt: now, updatedAt: now }
}
