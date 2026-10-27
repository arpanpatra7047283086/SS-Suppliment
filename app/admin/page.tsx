'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowUpRight, BadgeCheck, BarChart3, Building2, ChevronRight, CircleUserRound, KeyRound, LogOut, PackageSearch, ShieldCheck, Store, UsersRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import styles from './admin.module.css'

type Shop = { id: string; name: string; location: string; employees: number }
type Employee = { id: string; name: string; email: string; shopId?: string }

const actions = [
  { href: '/admin/AllShops', icon: Store, tag: 'CATALOGUE + ANALYTICS', title: 'Shops, products & analysis', text: 'Select any shop to review inventory, sales signals, product health and team activity.', tone: 'violet' },
  { href: '/admin/AddAdmin', icon: ShieldCheck, tag: 'PRIVILEGED ACCESS', title: 'Admin access', text: 'Invite another administrator and control who can enter this operations workspace.', tone: 'blue' },
  { href: '/admin/AddEmployee', icon: UsersRound, tag: 'SHOP-RESTRICTED ACCESS', title: 'Employee access', text: 'Create employee credentials, verify their email and assign them to one shop only.', tone: 'mint' },
]

export default function AdminPage() {
  const router = useRouter()
  const [shops, setShops] = useState<Shop[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [products, setProducts] = useState(0)
  useEffect(() => { void (async () => { const session = await fetch('/api/admin/me'); if (!session.ok) { router.replace('/login'); return }; const [s, e, p] = await Promise.all([fetch('/api/admin/shops'), fetch('/api/admin/employees'), fetch('/api/admin/products')]); if (s.ok) setShops(await s.json()); if (e.ok) setEmployees(await e.json()); if (p.ok) setProducts((await p.json()).length) })() }, [router])
  async function signOut() { await fetch('/api/auth/session', { method: 'DELETE' }); router.replace('/login') }
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.brand}><span className={styles.brandMark}>SS</span><span>SS Supplement<small>ADMIN OPERATIONS</small></span></Link><div className={styles.headerRight}><span className={styles.live}><i /> Secure workspace</span><div className={styles.adminIdentity}><span>AD</span><div><strong>Administrator</strong><small>FULL SYSTEM ACCESS</small></div><BadgeCheck /></div><button className={styles.iconButton} onClick={signOut} aria-label="Sign out"><LogOut /></button></div></header>
    <section className={styles.hero}><div><span className={styles.kicker}>CONTROL ROOM / 01</span><h1>Everything in one<br /><em>clear command center.</em></h1><p>Manage shops, product intelligence and access permissions without losing sight of the people behind each location.</p></div><div className={styles.heroBadge}><span>MONITORING</span><strong>All systems operational</strong><i /></div></section>
    <section className={styles.stats}>{[[Building2, shops.length, 'ACTIVE SHOPS'], [PackageSearch, products, 'PRODUCTS TRACKED'], [UsersRound, employees.length, 'TEAM ACCOUNTS'], [BarChart3, 'LIVE', 'DATA STATUS']].map(([Icon, value, label]) => <div key={String(label)}><Icon /><strong>{String(value)}</strong><span>{String(label)}</span></div>)}</section>
    <section className={styles.content}><div className={styles.sectionHeading}><div><span className={styles.kicker}>WORKSPACES</span><h2>Choose an operation</h2></div><span className={styles.sectionHint}>Three focused areas. One protected workspace.</span></div><div className={styles.actionGrid}>{actions.map(({ href, icon: Icon, tag, title, text, tone }, index) => <Link href={href} className={`${styles.actionCard} ${styles[tone]}`} key={href}><div className={styles.cardTop}><span className={styles.cardNumber}>0{index + 1}</span><span className={styles.cardIcon}><Icon /></span></div><span className={styles.cardTag}>{tag}</span><h3>{title}</h3><p>{text}</p><span className={styles.openAction}>Open workspace <ArrowUpRight /></span></Link>)}</div></section>
    <section className={styles.bottomGrid}><div className={styles.activity}><div className={styles.sectionHeading}><div><span className={styles.kicker}>QUICK VIEW</span><h2>Shop network</h2></div><Link href="/admin/AllShops">View all <ChevronRight /></Link></div><div className={styles.shopRows}>{shops.slice(0, 4).map((shop) => <div className={styles.shopRow} key={shop.id}><span className={styles.shopAvatar}>{shop.name.slice(0, 2).toUpperCase()}</span><div><strong>{shop.name}</strong><small>{shop.location} · {shop.employees} team members</small></div><i>READY</i></div>)}{shops.length === 0 && <p className={styles.empty}>Shop data will appear here once locations are connected.</p>}</div></div><aside className={styles.security}><KeyRound /><span className={styles.kicker}>ACCESS POLICY</span><h2>Private by design.</h2><p>Every employee account is linked to a single shop. Their panel cannot query another location&apos;s products, sales or customers.</p><Link href="/admin/AddEmployee">Configure employee access <ArrowUpRight /></Link></aside></section>
    <footer className={styles.footer}><span>SS SUPPLEMENT / ADMIN CONSOLE</span><span>Encrypted session · Role-based access · MongoDB protected</span></footer>
  </main>
}
