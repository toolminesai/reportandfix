'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function CompleteResetPage() {
  const [password, setPassword] = useState(''); const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const { error } = await createClient().auth.updateUser({ password }); setMessage(error ? 'The link is invalid or expired. Request a new one.' : 'Password updated. You can sign in with your new password.'); if (!error) setPassword('') }
  return <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10"><section className="w-full max-w-md rounded-3xl border border-border bg-card p-8"><h1 className="text-3xl font-bold text-primary">Choose a new password</h1><form onSubmit={submit} className="mt-8 space-y-4"><input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password" className="h-12 w-full rounded-xl border border-input bg-background px-4"/><button className="h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground">Update password</button></form>{message&&<p className="mt-5 text-sm text-muted-foreground">{message}</p>}<Link href="/auth" className="mt-6 inline-block text-sm font-semibold text-brand-blue">Return to sign in</Link></section></main>
}
