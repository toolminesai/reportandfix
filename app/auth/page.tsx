'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function authMessage(error: { message: string }) {
  const message = error.message.toLowerCase()
  if (message.includes('email not confirmed')) return 'Please confirm your email before signing in.'
  if (message.includes('invalid login credentials')) return 'Invalid email or password.'
  if (message.includes('password')) return 'Please use a password with at least 8 characters.'
  if (message.includes('rate limit') || message.includes('too many')) return 'Too many attempts. Please wait a few minutes and try again.'
  if (message.includes('email_address_not_authorized') || message.includes('not authorized')) return 'This email cannot receive confirmation in the current environment. Try an approved email address or configure SMTP.'
  if (message.includes('already registered') || message.includes('already been registered')) return 'This email is already registered. Try signing in instead.'
  return 'We could not complete that request. Please try again.'
}

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get('error')
    if (error === 'confirmation') setMessage('Your confirmation link is invalid or expired. Request a new one and try again.')
    if (error === 'account') setMessage('Your account profile is unavailable. Please contact an administrator.')
    if (error === 'suspended') setMessage('This account is suspended. Please contact an administrator.')
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedName = name.trim()
    if (mode === 'signup' && normalizedName.length < 2) return setMessage('Please enter your full name.')
    if (password.length < 8) return setMessage('Please use a password with at least 8 characters.')
    if (!normalizedEmail.includes('@')) return setMessage('Please enter a valid email address.')
    setLoading(true)
    const supabase = createClient()
    const result = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      : await supabase.auth.signUp({ email: normalizedEmail, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: { full_name: normalizedName } } })
    setLoading(false)
    if (result.error) return setMessage(authMessage(result.error))
    if (mode === 'signin') {
      const next = new URLSearchParams(window.location.search).get('next')
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) return setMessage('Sign-in succeeded, but the session could not be saved. Please enable cookies and try again.')
      window.location.assign(next || '/dashboard')
      return
    }
    setMessage('Account created. Check your email if confirmation is enabled.')
  }

  return <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[0.9fr_1.1fr]">
    <section className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
      <Link href="/" className="flex items-center gap-3"><Image src="/report-and-fix-logo.png" alt="ReportAndFix logo" width={176} height={176} className="h-20 w-20 object-contain" /><span className="font-mono text-sm font-bold tracking-[0.18em]">REPORT<span className="text-brand-green">ANDFIX</span></span></Link>
      <div><p className="font-mono text-xs uppercase tracking-[0.22em] text-primary-foreground/60">One clear path</p><h1 className="mt-5 max-w-lg text-5xl font-bold leading-tight tracking-[-0.04em]">Turn a report into a resolution.</h1><p className="mt-6 max-w-md leading-7 text-primary-foreground/70">Sign in to report campus issues, follow progress, and help your community keep moving forward.</p></div>
      <p className="text-sm text-primary-foreground/50">ReportAndFix</p>
    </section>
    <section className="flex items-center justify-center px-6 py-10"><div className="w-full max-w-md"><Link href="/" className="mb-12 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back home</Link><div className="mb-9 lg:hidden"><Image src="/report-and-fix-logo.png" alt="ReportAndFix logo" width={176} height={176} className="h-20 w-20 object-contain" /></div><p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">{mode === 'signin' ? 'Welcome back' : 'Join the network'}</p><h2 className="mt-3 text-4xl font-bold tracking-tight text-primary">{mode === 'signin' ? 'Sign in' : 'Create your account'}</h2><p className="mt-3 text-muted-foreground">{mode === 'signin' ? 'Sign in to continue to your workspace.' : 'Create a student or faculty account.'}</p>
      <form onSubmit={handleSubmit} className="mt-9 space-y-5">{mode === 'signup' && <label className="block"><span className="mb-2 block text-sm font-semibold">Full name</span><input required value={name} onChange={(event) => setName(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-card px-4 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" /></label>}<label className="block"><span className="mb-2 block text-sm font-semibold">Email</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-card px-4 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" /></label><label className="block"><span className="mb-2 block text-sm font-semibold">Password</span><input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-card px-4 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" /></label><button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground transition hover:bg-brand-blue disabled:opacity-60">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{mode === 'signin' ? 'Sign in securely' : 'Create account'}</button></form>{message && <p role="status" className="mt-5 rounded-xl border border-brand-blue/20 bg-brand-blue-soft px-4 py-3 text-sm text-primary">{message}</p>}<button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage('') }} className="mt-7 text-sm font-semibold text-brand-blue hover:underline">{mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}</button></div></section>
  </main>
}
