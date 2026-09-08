'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SuperAdminSetupPage() {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function bootstrap() {
    setLoading(true)
    setMessage('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return setMessage('Please sign in first, then return to this page.') }
    const { error } = await supabase.rpc('bootstrap_super_admin')
    if (error) { setLoading(false); return setMessage(error.message.includes('already') ? 'Super Admin setup is already complete.' : 'Only the first signed-in account can complete this setup.') }
    await supabase.auth.refreshSession()
    setLoading(false)
    router.replace('/staff')
    router.refresh()
  }

  return <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12"><section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 shadow-sm"><p className="font-mono text-xs uppercase tracking-[0.22em] text-brand-blue">One-time platform setup</p><h1 className="mt-3 text-4xl font-bold tracking-tight text-primary">Create the Super Admin</h1><p className="mt-4 leading-7 text-muted-foreground">Sign in with the first platform owner account, then claim the Super Admin role. This database-enforced action works only while no Super Admin exists.</p><div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={bootstrap} disabled={loading} className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60">{loading ? 'Checking setup…' : 'Claim Super Admin role'}</button><Link href="/auth" className="rounded-xl border border-border px-5 py-3 font-semibold">Sign in first</Link></div>{message && <p role="status" className="mt-5 rounded-xl border border-brand-blue/20 bg-brand-blue-soft px-4 py-3 text-sm text-primary">{message}</p>}</section></main>
}
