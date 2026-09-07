'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, Send } from 'lucide-react'

export type ReportContext = { locationId: string; locationName: string; collegeId: string; categories: { id: string; name: string }[] }

export default function ReportForm({ context }: { context: ReportContext }) {
  const supabase = useMemo(() => createClient(), [])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState(context.categories[0]?.id ?? '')
  const [priority, setPriority] = useState('medium')
  const [anonymous, setAnonymous] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    if (title.trim().length < 5 || description.trim().length < 15) {
      setStatus({ kind: 'error', text: 'Add a clear title and at least 15 characters describing the issue.' })
      return
    }
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setBusy(false)
      setStatus({ kind: 'error', text: 'Your session expired. Sign in again to submit this report.' })
      return
    }
    const { data: complaint, error } = await supabase.rpc('create_complaint', {
      p_title: title.trim(), p_description: description.trim(), p_college_id: context.collegeId,
      p_reporter_id: user.id, p_category_id: categoryId || null, p_location_id: context.locationId,
      p_priority: priority, p_is_anonymous: anonymous,
    })
    if (error || !complaint) {
      setBusy(false)
      setStatus({ kind: 'error', text: 'We could not submit your report. Please try again.' })
      return
    }
    for (const file of files.slice(0, 5)) {
      const path = `${user.id}/${complaint.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
      const upload = await supabase.storage.from('complaint-media').upload(path, file, { contentType: file.type, upsert: false })
      if (!upload.error) await supabase.from('complaint_media').insert({ complaint_id: complaint.id, storage_path: path, media_type: file.type })
    }
    setBusy(false)
    setStatus({ kind: 'success', text: `Report ${complaint.public_id} submitted. You can track its progress from My reports.` })
    setTitle(''); setDescription(''); setFiles([])
  }

  return <form onSubmit={submit} className="space-y-5" noValidate>
    <div><label htmlFor="report-title" className="text-sm font-semibold text-primary">What needs attention?</label><input id="report-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Water leak near the library" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-primary focus:ring-2" required /></div>
    <div><label htmlFor="report-description" className="text-sm font-semibold text-primary">Describe the issue</label><textarea id="report-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Include useful details such as exact area, urgency, and what you observed." className="mt-2 min-h-32 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-primary focus:ring-2" required /></div>
    <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="report-category" className="text-sm font-semibold text-primary">Category</label><select id="report-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm">{context.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div><div><label htmlFor="report-priority" className="text-sm font-semibold text-primary">Priority</label><select id="report-priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div></div>
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="h-4 w-4 accent-primary" /> Submit anonymously to other campus users</label>
    <div><label htmlFor="report-files" className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border px-4 py-4 text-sm text-muted-foreground hover:bg-muted"><ImagePlus className="h-5 w-5 text-brand-blue" /><span>{files.length ? `${files.length} image${files.length === 1 ? '' : 's'} selected` : 'Attach up to 5 supporting images'}</span></label><input id="report-files" type="file" accept="image/*" multiple className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))} /></div>
    {status && <p role="status" className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${status.kind === 'success' ? 'bg-brand-green-soft text-primary' : 'bg-destructive/10 text-destructive'}`}>{status.kind === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}{status.text}</p>}
    <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit report</button>
  </form>
}
