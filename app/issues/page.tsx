import Link from 'next/link'
import { ArrowRight, CheckCircle2, MapPin, ThumbsUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Issue = {
  id: string
  public_id: string
  title: string
  description: string
  status: string
  priority: string
  created_at: string
  category_name: string | null
  location_name: string | null
  vote_count: number
}

function statusLabel(status: string) {
  return status.replaceAll('_', ' ')
}

export default async function IssuesPage() {
  const supabase = await createClient()
  const { data: issues, error } = await supabase.rpc('public_issue_feed')
  const rows = (issues ?? []) as Issue[]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <Link href="/" className="font-mono text-sm font-bold tracking-[0.18em] text-primary">REPORT<span className="text-brand-green">ANDFIX</span></Link>
          <div className="flex items-center gap-3">
            <Link href="/report" className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Report an issue</Link>
            <Link href="/auth" className="hidden rounded-full border border-border px-4 py-2 text-sm font-semibold sm:inline-flex">Sign in</Link>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 pb-16 pt-12 lg:px-10">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-blue">Campus issues</p>
          <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight text-primary sm:text-5xl">See what your campus is fixing.</h1>
          <p className="mt-4 text-pretty text-lg leading-8 text-muted-foreground">A transparent, privacy-conscious view of reported issues and their progress.</p>
        </div>
        {error ? <div className="mt-10 rounded-2xl border border-destructive/30 bg-card p-6 text-destructive">The public issue feed is temporarily unavailable.</div> : rows.length === 0 ? <div className="mt-10 rounded-3xl border border-dashed border-border bg-card p-12 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-brand-green" /><h2 className="mt-4 text-xl font-bold text-primary">No public issues yet</h2><p className="mt-2 text-muted-foreground">Be the first to help your campus improve.</p></div> : <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{rows.map((issue) => <Link key={issue.id} href={`/issues/${issue.public_id}`} className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand-blue/50 hover:shadow-lg"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-brand-green-soft px-3 py-1 text-xs font-bold capitalize text-brand-green">{statusLabel(issue.status)}</span><span className="font-mono text-xs text-muted-foreground">{issue.public_id}</span></div><h2 className="mt-5 line-clamp-2 text-xl font-bold text-primary group-hover:text-brand-blue">{issue.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{issue.description}</p><div className="mt-6 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{issue.location_name ?? 'Campus-wide'}</span><span className="inline-flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" />{issue.vote_count ?? 0} joined</span></div><div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">View issue <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></div></Link>)}</div>}
      </section>
    </main>
  )
}
