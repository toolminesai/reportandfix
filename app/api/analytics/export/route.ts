import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('college_id, role').eq('id', user.id).maybeSingle()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return new NextResponse('Forbidden', { status: 403 })
  const { data, error } = await supabase.from('complaints').select('public_id,title,status,priority,created_at,resolved_at').eq('college_id', profile.college_id).order('created_at', { ascending: false })
  if (error) return new NextResponse('Export unavailable', { status: 500 })
  const header = 'public_id,title,status,priority,created_at,resolved_at'
  const rows = (data ?? []).map((item) => [item.public_id, item.title, item.status, item.priority, item.created_at, item.resolved_at ?? ''].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
  return new NextResponse([header, ...rows].join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="reportandfix-issues.csv"' } })
}
