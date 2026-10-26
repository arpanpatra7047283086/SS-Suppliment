'use client'

import Link from 'next/link'
import { ArrowUpRight, MessageCircle } from 'lucide-react'

export function BrandMark({ dark = false }: { dark?: boolean }) {
  return (
    <span className={`flex items-center gap-3 ${dark ? 'text-[#0b1713]' : 'text-[#f4f2e9]'}`}>
      <span className="grid size-12 place-items-center rounded-[14px] bg-[#91edba] text-[#07120e] shadow-[0_0_32px_rgba(145,237,186,0.12)]">
        <span className="flex gap-1.5"><span className="h-5 w-2 rounded-full bg-current" /><span className="h-5 w-2 rounded-full bg-current" /></span>
      </span>
      <span className="flex flex-col leading-none">
        <strong className="text-[20px] font-bold tracking-tight">SS Supplement</strong>
        <small className="mt-1.5 text-[9px] font-semibold tracking-[0.28em] text-[#91edba]/60">SS SUPPLEMENT</small>
      </span>
    </span>
  )
}

export function SiteHeader({ light = false }: { light?: boolean }) {
  return (
    <header className={`site-header ${light ? 'site-header-light' : ''}`}>
      <Link href="/" aria-label="SS Supplement home"><BrandMark dark={light} /></Link>
      <nav className="hidden items-center gap-10 md:flex" aria-label="Primary navigation">
        <Link href="/" className="nav-link">Home</Link>
        <Link href="#how-it-works" className="nav-link">How it works <span className="new-pill">New</span></Link>
        <Link href="#benefits" className="nav-link">Benefits</Link>
        <Link href="#faq" className="nav-link">FAQs</Link>
      </nav>
      <div className="flex items-center gap-2.5">
        <Link href="#ask" className="ask-button"><MessageCircle className="size-4" /> <span className="hidden sm:inline">Ask AI</span></Link>
        <Link href="/login" className="sign-button">Sign in</Link>
      </div>
    </header>
  )
}

export function ChatBubble() {
  return <button className="chat-bubble" aria-label="Open assistant"><MessageCircle className="size-6" /><span className="chat-dot" /></button>
}

export function ArrowButton({ href = '#ask' }: { href?: string }) {
  return <Link href={href} className="arrow-button" aria-label="Continue"><ArrowUpRight className="size-7" /></Link>
}
