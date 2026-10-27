'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { BrandMark } from '@/components/site-header'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const verificationStep = Boolean(transactionId)

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(''); setIsSubmitting(true)
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) { setMessage(result.error || 'Unable to start sign in.'); return }
      setTransactionId(result.transactionId); setPassword('')
    } catch { setMessage('Unable to contact the sign-in service.') } finally { setIsSubmitting(false) }
  }

  async function submitOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(''); setIsSubmitting(true)
    try {
      const response = await fetch('/api/auth/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ transactionId, otp }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) { setMessage(result.error || 'Invalid verification code.'); return }
      router.push(result.destination); router.refresh()
    } catch { setMessage('Unable to verify the code.') } finally { setIsSubmitting(false) }
  }

  return <main className="login-page"><div className="login-nav"><Link href="/"><BrandMark /></Link><Link href="/" className="close-link" aria-label="Close"><X /></Link></div><div className="login-shell"><aside className="login-aside"><BrandMark dark /><div className="login-aside-copy"><div className="eyebrow dark"><span /> SECURE SHOP MANAGEMENT</div><h1>Run your shop<br />with <em>confidence.</em></h1><p>Secure access for SS Supplement administrators and shop teams.</p></div><div className="privacy-note">Private by default</div></aside><section className="login-form-wrap"><div className="auth-tabs"><button className="active" type="button">{verificationStep ? 'Email verification' : 'Secure sign in'}</button></div><div className="auth-intro"><div className="eyebrow dark">{verificationStep ? 'ONE MORE STEP' : 'WELCOME BACK'}</div><h2>{verificationStep ? 'Check your inbox.' : 'Good to have you here.'}</h2><p>{verificationStep ? `Enter the six-digit code sent to ${email}.` : 'Sign in to manage your shop operations.'}</p></div>{verificationStep ? <form onSubmit={submitOtp}><label htmlFor="otp">Verification code</label><input id="otp" type="text" inputMode="numeric" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" autoComplete="one-time-code" required /><button className="submit-button" type="submit" disabled={isSubmitting || otp.length !== 6}>{isSubmitting ? 'Verifying…' : <>Verify and continue <ArrowRight /></>}</button><button type="button" className="mt-4 w-full text-sm text-[#4d8767]" onClick={() => { setTransactionId(''); setOtp(''); setMessage('') }}>Use a different account</button></form> : <form onSubmit={submitCredentials}><label htmlFor="email">Email</label><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /><div className="password-label"><label htmlFor="password">Password</label></div><div className="password-input"><input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" autoComplete="current-password" minLength={8} required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff /> : <Eye />}</button></div><button className="submit-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending code…' : <>Continue <ArrowRight /></>}</button></form>}{message && <p role="alert" className="mt-4 text-center text-sm text-red-700">{message}</p>}</section></div></main>
}
