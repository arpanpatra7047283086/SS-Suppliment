import { MongoClient, type Db } from 'mongodb'

const globalForMongo = globalThis as typeof globalThis & { __ssMongoClientPromise?: Promise<MongoClient> }
let indexesReady: Promise<void> | undefined

async function getClient() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not configured')
  if (!globalForMongo.__ssMongoClientPromise) globalForMongo.__ssMongoClientPromise = new MongoClient(uri).connect()
  return globalForMongo.__ssMongoClientPromise
}

export async function getDatabase(): Promise<Db> {
  const db = (await getClient()).db(process.env.MONGODB_DB || 'ss-supplement')
  indexesReady ??= Promise.all([
    db.collection('otp_requests').createIndex({ email: 1 }, { unique: true }),
    db.collection('otp_requests').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('products').createIndex({ slug: 1 }, { unique: true }),
    db.collection('products').createIndex({ createdAt: -1 }),
  ]).then(() => undefined)
  await indexesReady
  return db
}
