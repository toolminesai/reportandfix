import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import VoteButton from './vote-button'
import ShareButton from './share-button'

export const dynamic = 'force-dynamic'

export default async function IssueDetailPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params
  const supabase = await createClient()
  const [{ data: issue }, { data: history }] = await Promise.all([
    supabase.rpc('public_issue_detail', { p_public_id: publicId }).maybeSingle(),
    supabase.rpc('public_issue_history', { p_public_id: publicId }),
  ])
  if (!issue) return <main className="flex min-h-screen items-center justify-center bg-background px-6"><div className="text-center"><h1 className="text-3xl font-bold text-primary">Issue not found</h1><p className="mt-3 text-muted-foreground">This issue may be private or no longer available.</p><Link href="/issues" className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Back to issues</Link></div></main>
  return <main className="min-h-screen bg-background px-6 py-10 text-foreground"><div className="mx-auto max-w-3xl"><Link href="/issues" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> All issues</Link><article className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10"><div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-brand-green-soft px-3 py-1 text-xs font-bold capitalize text-brand-green">{issue.status.replaceAll('_', ' ')}</span><span className="font-mono text-xs text-muted-foreground">{issue.public_id}</span></div><h1 className="mt-6 text-balance text-4xl font-bold tracking-tight text-primary">{issue.title}</h1><div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{issue.location_name ?? 'Campus-wide'}</span><span>{issue.category_name ?? 'General issue'}</span></div><p className="mt-8 whitespace-pre-wrap text-base leading-8 text-foreground/80">{issue.description}</p><div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6"><VoteButton issueId={issue.id} initialCount={Number(issue.vote_count ?? 0)} /><ShareButton publicId={issue.public_id} /></div></article><section className="mt-6 rounded-3xl border border-border bg-card p-6 sm:p-8"><h2 className="text-xl font-bold text-primary">Progress timeline</h2><div className="mt-6 space-y-5">{(history ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Updates will appear here as the campus team works on this issue.</p> : history?.map((event) => <div key={event.id} className="flex gap-4"><div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-brand-green ring-4 ring-brand-green-soft" /><div><p className="font-semibold capitalize text-primary">{event.to_status.replaceAll('_', ' ')}</p><p className="mt-1 text-sm text-muted-foreground">{event.note ?? 'Status updated'} · {new Date(event.created_at).toLocaleDateString()}</p></div></div>)}</div></section></div></main>
}
