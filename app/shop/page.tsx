import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export default async function ShopPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role === 'admin') redirect('/admin')
  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f5f4ee', color: '#102219', padding: 24 }}><section style={{ maxWidth: 520, padding: 40, borderRadius: 20, background: '#fffefa', border: '1px solid #d8dfd6' }}><p style={{ color: '#4f8c67', font: '700 11px monospace', letterSpacing: '.12em' }}>EMPLOYEE DASHBOARD</p><h1 style={{ fontSize: 36, letterSpacing: '-.06em' }}>Welcome to your shop workspace.</h1><p style={{ color: '#68776e', lineHeight: 1.6 }}>Your account is restricted to the products and shop data assigned by the administrator.</p></section></main>
}
