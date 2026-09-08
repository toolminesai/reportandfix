'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage('')
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/reset/complete` })
    setLoading(false)
    setMessage(error ? 'We could not send the reset email. Please try again.' : 'If an account exists for that email, a password reset link has been sent.')
  }
  return <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10"><section className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm"><Link href="/auth" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link><h1 className="mt-8 text-3xl font-bold text-primary">Reset your password</h1><p className="mt-3 leading-6 text-muted-foreground">Enter your account email and we&apos;ll send a secure reset link.</p><form onSubmit={submit} className="mt-8 space-y-4"><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" className="h-12 w-full rounded-xl border border-input bg-background px-4" /><button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-60">{loading&&<Loader2 className="h-4 w-4 animate-spin"/>}Send reset link</button></form>{message&&<p role="status" className="mt-5 rounded-xl bg-brand-blue-soft px-4 py-3 text-sm text-primary">{message}</p>}</section></main>
}
