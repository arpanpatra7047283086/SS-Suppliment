import bcrypt from 'bcryptjs'
import { ObjectId } from 'mongodb'
import { getDatabase } from './mongodb'
import type { Role, Session } from './session'

export type AccountStatus = 'active' | 'suspended' | 'inactive'
export type User = { _id?: ObjectId; name: string; employeeId?: string; email: string; passwordHash: string; role: Role; shopId?: string; permissions: string[]; status: AccountStatus; phone?: string; createdAt: Date; updatedAt: Date }
export type Shop = { _id?: ObjectId; shopId: string; name: string; address: string; location: string; contactEmail?: string; contactPhone?: string; status: AccountStatus; createdAt: Date; updatedAt: Date }

const normalizeEmail = (email: string) => email.trim().toLowerCase()
export const ADMIN_EMAIL = 'info.sssupplements@gmail.com'

export async function findAccountByEmail(email: string): Promise<User | null> {
  const normalized = normalizeEmail(email)
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || ADMIN_EMAIL
  const adminHash = process.env.ADMIN_PASSWORD_HASH
  if (adminEmail && adminHash && normalized === adminEmail) return { name: 'SS Supplement Administrator', employeeId: 'ADMIN', email: adminEmail, passwordHash: adminHash, role: 'admin', permissions: ['*'], status: 'active', createdAt: new Date(0), updatedAt: new Date(0) }
  const account = await getDatabase().collection<User>('users').findOne({ email: normalized, status: 'active' })
  // The owner account is always an administrator, even when it is stored in MongoDB.
  return account && normalized === ADMIN_EMAIL ? { ...account, role: 'admin', permissions: ['*'] } : account
}

export async function verifyAccount(email: string, password: string) {
  const account = await findAccountByEmail(email)
  if (!account || account.status !== 'active' || !(await bcrypt.compare(password, account.passwordHash))) return null
  return account
}

export function accountSession(account: User): Session {
  const email = normalizeEmail(account.email)
  return { userId: account._id?.toString() || 'environment-admin', email, role: email === ADMIN_EMAIL ? 'admin' : account.role, ...(account.shopId ? { shopId: account.shopId } : {}) }
}

export async function createEmployee(input: Omit<User, '_id' | 'passwordHash' | 'createdAt' | 'updatedAt'> & { password: string }) {
  const db = await getDatabase()
  const now = new Date()
  const email = normalizeEmail(input.email)
  const employeeId = input.employeeId?.trim()
  if (await db.collection<User>('users').findOne({ email })) throw new Error('EMAIL_EXISTS')
  if (employeeId && await db.collection<User>('users').findOne({ employeeId })) throw new Error('EMPLOYEE_ID_EXISTS')
  const { password, ...employee } = input
  const passwordHash = await bcrypt.hash(password, 12)
  try {
    const result = await db.collection<User>('users').insertOne({ ...employee, email, employeeId, passwordHash, createdAt: now, updatedAt: now })
    return { id: result.insertedId.toString(), ...employee, email }
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) throw new Error('EMAIL_EXISTS')
    throw error
  }
}

export function serializeUser({ _id, passwordHash, ...user }: User) { return { id: _id?.toString(), ...user } }
