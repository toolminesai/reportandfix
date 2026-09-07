import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ location?: string }> }) {
  const { location: token } = await searchParams
  const supabase = await createClient()
  const { data: location } = token ? await supabase.from('locations').select('name, qr_token').eq('qr_token', token).maybeSingle() : { data: null }
  if (!location) return <main className="flex min-h-screen items-center justify-center bg-background px-6"><div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center"><h1 className="text-2xl font-bold text-primary">This QR code is inactive</h1><p className="mt-3 text-muted-foreground">The location token may have been regenerated. Ask a campus admin for a new QR code.</p><Link href="/" className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Back to ReportAndFix</Link></div></main>
  return <main className="flex min-h-screen items-center justify-center bg-background px-6"><div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 shadow-xl"><p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-brand-blue">Active report location</p><h1 className="mt-3 text-4xl font-bold tracking-tight text-primary">{location.name}</h1><p className="mt-4 leading-7 text-muted-foreground">This QR code is active and ready for the reporting workflow. Phase 3 will add the full complaint form.</p><Link href="/auth" className="mt-8 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Sign in to report</Link></div></main>
}
