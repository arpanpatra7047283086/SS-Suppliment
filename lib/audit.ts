import { getDatabase } from './mongodb'

export async function writeAudit(action: string, actor: { userId: string; email: string; role: string }, details: Record<string, unknown> = {}) {
  await (await getDatabase()).collection('audit_logs').insertOne({ action, actor, details, createdAt: new Date() })
}
