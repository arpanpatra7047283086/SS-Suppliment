import { MongoClient, type Db } from 'mongodb'

const globalForMongo = globalThis as typeof globalThis & { __ssMongoClientPromise?: Promise<MongoClient> }
let indexesReady: Promise<void> | undefined

async function getClient() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_CONNECTION_STRING
  if (!uri) throw new Error('MONGODB_URI or MONGODB_CONNECTION_STRING is not configured')
  const clientPromise = globalForMongo.__ssMongoClientPromise ?? (globalForMongo.__ssMongoClientPromise = new MongoClient(uri).connect())
  try {
    return await clientPromise
  } catch (error) {
    if (globalForMongo.__ssMongoClientPromise === clientPromise) delete globalForMongo.__ssMongoClientPromise
    throw error
  }
}

export async function getDatabase(): Promise<Db> {
  const db = (await getClient()).db(process.env.MONGODB_DB || 'ss-supplement')
  if (!indexesReady) {
    indexesReady = Promise.all([
      db.collection('otp_requests').createIndex({ email: 1 }, { unique: true }),
      db.collection('otp_requests').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection('products').createIndex({ slug: 1 }, { unique: true, partialFilterExpression: { slug: { $type: 'string' } } }),
      db.collection('products').createIndex({ createdAt: -1 }),
      db.collection('users').createIndex({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' }, status: 'active' } }),
      db.collection('users').createIndex({ employeeId: 1 }, { unique: true, sparse: true }),
      db.collection('shops').createIndex({ shopId: 1 }, { unique: true }),
      db.collection('login_otps').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection('login_otps').createIndex({ transactionId: 1 }, { unique: true }),
      db.collection('audit_logs').createIndex({ createdAt: -1 }),
    ]).then(() => undefined).catch((error: unknown) => {
      indexesReady = undefined
      throw error
    })
  }
  await indexesReady
  return db
}
