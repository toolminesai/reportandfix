'use client'

import { useState } from 'react'
import { ThumbsUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function VoteButton({ issueId, initialCount }: { issueId: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  async function toggleVote() {
    setLoading(true); setMessage('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.assign(`/auth?next=${encodeURIComponent(window.location.pathname)}`); return }
    const { data: existing } = await supabase.from('complaint_votes').select('complaint_id').eq('complaint_id', issueId).eq('user_id', user.id).maybeSingle()
    if (existing) { await supabase.from('complaint_votes').delete().eq('complaint_id', issueId).eq('user_id', user.id); setCount((value) => Math.max(0, value - 1)) }
    else { const { error } = await supabase.from('complaint_votes').insert({ complaint_id: issueId, user_id: user.id }); if (error) setMessage('Unable to update your support right now.'); else setCount((value) => value + 1) }
    setLoading(false)
  }
  return <div><button type="button" onClick={toggleVote} disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-brand-blue-soft px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-brand-blue hover:text-primary-foreground disabled:opacity-60"><ThumbsUp className="h-4 w-4" /> Join issue · {count}</button>{message && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}</div>
}
