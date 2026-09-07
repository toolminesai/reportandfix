'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, ClipboardList, Loader2, UserRound } from 'lucide-react'

type QueueItem = { id: string; public_id: string; title: string; description: string; status: string; priority: string; created_at: string; assigned_worker_id?: string | null; location_name?: string | null; category_name?: string | null }
type Props = { profile: { full_name: string; role: string; college_id: string }; initialQueue: QueueItem[]; workers: { id: string; full_name: string }[] }

export default function OperationsClient({ profile, initialQueue, workers }: Props) {
  const [queue, setQueue] = useState(initialQueue)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const supabase = createClient()
  const canAssign = ['admin', 'super_admin'].includes(profile.role)

  async function assign(id: string, workerId: string) {
    setBusy(id)
    const { data, error } = await supabase.rpc('assign_complaint', { p_complaint_id: id, p_worker_id: workerId })
    setBusy(null)
    if (error) return setMessage(error.message)
    setQueue((items) => items.map((item) => item.id === id ? { ...item, status: data.status, assigned_worker_id: data.assigned_worker_id } : item))
    setMessage('Issue assigned and reporter timeline updated.')
  }

  async function verify(item: QueueItem, approve: boolean) {
    const note = window.prompt(approve ? 'Verification note (optional)' : 'Reopen reason (required)')
    if (!approve && !note?.trim()) return setMessage('A reopen reason is required.')
    setBusy(item.id)
    const { error } = await supabase.rpc('verify_complaint', { p_complaint_id: item.id, p_approve: approve, p_note: note?.trim() || null })
    setBusy(null)
    if (error) return setMessage(error.message)
    setQueue(items => items.map(current => current.id === item.id ? { ...current, status: approve ? 'completed' : 'reopened' } : current))
    setMessage(approve ? 'Issue verified and completed.' : 'Issue reopened for further work.')
  }

  async function addProgress(item: QueueItem) {
    const note = window.prompt('Progress note')
    if (!note?.trim()) return
    const raw = window.prompt('Progress percent (0-100)', '50')
    const percent = Number(raw)
    if (!Number.isInteger(percent) || percent < 0 || percent > 100) return setMessage('Enter a whole number from 0 to 100.')
    setBusy(item.id)
    const { error } = await supabase.rpc('add_progress', { p_complaint_id: item.id, p_note: note.trim(), p_percent: percent })
    setBusy(null)
    if (error) return setMessage(error.message)
    setQueue((items) => items.map((current) => current.id === item.id ? { ...current, status: percent >= 100 ? 'resolved' : 'in_progress' } : current))
    setMessage('Progress saved to the complaint history.')
  }

  return <main className="min-h-screen bg-background text-foreground"><header className="border-b border-border bg-card"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-brand-blue">Operations</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Work queue</h1><p className="mt-1 text-sm text-muted-foreground">Assign, repair, and document every campus issue.</p></div><ClipboardList className="h-8 w-8 text-brand-green" /></div></header><div className="mx-auto max-w-6xl px-6 py-8">{message && <p role="status" className="mb-5 rounded-xl border border-brand-blue/20 bg-brand-blue-soft px-4 py-3 text-sm text-primary">{message}</p>}<div className="grid gap-4">{queue.length === 0 ? <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">No active issues in your queue.</div> : queue.map((item) => <article key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 md:flex-row"><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-bold text-brand-blue">{item.public_id}</span><span className="rounded-full bg-brand-green-soft px-2.5 py-1 text-xs font-semibold text-primary">{item.status.replace('_', ' ')}</span><span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold">{item.priority}</span></div><h2 className="mt-3 text-xl font-semibold">{item.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{item.description}</p></div><div className="flex items-start gap-2">{canAssign && <select aria-label={`Assign ${item.public_id}`} defaultValue={item.assigned_worker_id ?? ''} onChange={(event) => assign(item.id, event.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" disabled={busy === item.id}><option value="">Assign worker</option>{workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.full_name}</option>)}</select>}{!canAssign && <button onClick={() => addProgress(item)} disabled={busy === item.id} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Add progress</button>}{canAssign && item.status === 'waiting_for_verification' && <div className="flex gap-2"><button onClick={() => verify(item,true)} disabled={busy === item.id} className="rounded-lg bg-brand-green px-3 py-2 text-sm font-semibold text-primary">Approve</button><button onClick={() => verify(item,false)} disabled={busy === item.id} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold">Reopen</button></div>}</div></div><div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><UserRound className="h-4 w-4" /> {item.location_name ?? 'Campus-wide'} {item.category_name ? `· ${item.category_name}` : ''}</div></article>)}</div></div></main>
}
