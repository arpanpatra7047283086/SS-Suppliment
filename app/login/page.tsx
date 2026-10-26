'use client'

import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, X } from 'lucide-react'
import { useState } from 'react'
import { BrandMark } from '@/components/site-header'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  return <main className="login-page"><div className="login-nav"><Link href="/"><BrandMark /></Link><Link href="/" className="close-link" aria-label="Close"><X /></Link></div><div className="login-shell"><aside className="login-aside"><BrandMark dark /><div className="login-aside-copy"><div className="eyebrow dark"><span /> A QUIETER KIND OF INTELLIGENCE</div><h1>Make space for<br />the <em>good questions.</em></h1><p>Bring your reading, research, and rough ideas into one grounded space.</p></div><div className="privacy-note">✓ <span>Private by default</span></div></aside><section className="login-form-wrap"><div className="auth-tabs"><button className="active">Sign in</button><button>Create account</button></div><div className="auth-intro"><div className="eyebrow dark">WELCOME BACK</div><h2>Good to have you here.</h2><p>Pick up your thinking right where you left it.</p></div><form onSubmit={(e) => e.preventDefault()}><label htmlFor="email">Email</label><input id="email" type="email" placeholder="you@example.com" required /><div className="password-label"><label htmlFor="password">Password</label><Link href="#">Forgot password?</Link></div><div className="password-input"><input id="password" type={showPassword ? 'text' : 'password'} placeholder="Your password" required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff /> : <Eye />}</button></div><label className="remember"><input type="checkbox" /> <span>Remember me</span></label><button className="submit-button" type="submit">Sign in <ArrowRight /></button></form><p className="create-prompt">New to SS Supplement? <Link href="#">Create an account</Link></p></section></div></main>
}
