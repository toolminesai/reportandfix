import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Activity, AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/dashboard')
  const { data } = await supabase.rpc('analytics_summary')
  const summary = data?.[0] ?? { total: 0, open_count: 0, resolved_count: 0, critical_count: 0, avg_resolution_hours: 0 }
  const cards = [{ label: 'All reports', value: summary.total, icon: Activity }, { label: 'Open queue', value: summary.open_count, icon: Clock3 }, { label: 'Resolved', value: summary.resolved_count, icon: CheckCircle2 }, { label: 'Critical', value: summary.critical_count, icon: AlertTriangle }]
  return <main className="min-h-screen bg-background text-foreground"><header className="border-b border-border bg-card"><div className="mx-auto max-w-6xl px-6 py-5"><p className="font-mono text-xs uppercase tracking-[0.18em] text-brand-blue">Phase 6 · Insights</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Campus performance</h1><p className="mt-1 text-sm text-muted-foreground">Live operational metrics scoped to your college.</p></div></header><div className="mx-auto max-w-6xl px-6 py-8"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-border bg-card p-5"><Icon className="h-5 w-5 text-brand-blue" /><p className="mt-5 text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p></div>)}</div><section className="mt-6 rounded-2xl border border-border bg-card p-6"><h2 className="text-lg font-semibold">Resolution health</h2><div className="mt-5 flex items-end gap-3"><span className="text-5xl font-bold text-brand-blue">{Number(summary.avg_resolution_hours).toFixed(1)}</span><span className="pb-2 text-sm text-muted-foreground">average hours to resolution</span></div><div className="mt-6 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand-green" style={{ width: `${summary.total ? Math.min(100, Number(summary.resolved_count) / Number(summary.total) * 100) : 0}%` }} /></div><p className="mt-3 text-sm text-muted-foreground">Resolved share across the live complaint lifecycle.</p></section></div></main>
}
