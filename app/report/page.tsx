import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReportForm from './report-form'

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ location?: string }> }) {
  const { location: token } = await searchParams
  const supabase = await createClient()
  const { data: location } = token ? await supabase.from('locations').select('id, name, qr_token, college_id').eq('qr_token', token).maybeSingle() : { data: null }
  if (!location) return <main className="flex min-h-screen items-center justify-center bg-background px-6"><div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center"><h1 className="text-2xl font-bold text-primary">This QR code is inactive</h1><p className="mt-3 text-muted-foreground">The location token may have been regenerated. Ask a campus admin for a new QR code.</p><Link href="/" className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Back to ReportAndFix</Link></div></main>
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <main className="flex min-h-screen items-center justify-center bg-background px-6"><div className="max-w-lg rounded-3xl border border-border bg-card p-8 text-center"><p className="font-mono text-xs uppercase tracking-[0.18em] text-brand-blue">Active report location</p><h1 className="mt-3 text-4xl font-bold tracking-tight text-primary">{location.name}</h1><p className="mt-4 leading-7 text-muted-foreground">Sign in to report an issue at this location and track its resolution.</p><Link href={`/auth?next=${encodeURIComponent(`/report?location=${location.qr_token}`)}`} className="mt-8 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Sign in to report</Link></div></main>
  const [{ data: profile }, { data: categories }] = await Promise.all([
    supabase.from('profiles').select('college_id').eq('id', user.id).maybeSingle(),
    supabase.from('categories').select('id, name').eq('college_id', location.college_id).order('name'),
  ])
  if (!profile || profile.college_id !== location.college_id) return <main className="flex min-h-screen items-center justify-center bg-background px-6"><div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center"><h1 className="text-2xl font-bold text-primary">This location is outside your campus</h1><p className="mt-3 text-muted-foreground">Use a report QR code from your own college.</p></div></main>
  return <main className="min-h-screen bg-background px-6 py-10 text-foreground"><div className="mx-auto max-w-2xl"><Link href="/" className="font-mono text-xs font-bold tracking-[0.16em] text-primary">REPORT<span className="text-brand-green">ANDFIX</span></Link><div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-9"><p className="font-mono text-xs uppercase tracking-[0.18em] text-brand-blue">Reporting at</p><h1 className="mt-3 text-4xl font-bold tracking-tight text-primary">{location.name}</h1><p className="mt-3 text-muted-foreground">Help your campus team understand and resolve the issue quickly.</p><div className="my-8 border-t border-border" /><ReportForm context={{ locationId: location.id, locationName: location.name, collegeId: location.college_id, categories: categories ?? [] }} /></div></div></main>
}
