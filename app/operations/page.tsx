import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OperationsClient from './operations-client'

export default async function OperationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  const { data: profile } = await supabase.from('profiles').select('full_name, role, college_id').eq('id', user.id).maybeSingle()
  if (!profile || !['admin', 'super_admin', 'worker'].includes(profile.role)) redirect('/dashboard')
  const { data: queue } = profile.role === 'worker'
    ? await supabase.from('complaints').select('id, public_id, title, description, status, priority, created_at, assigned_worker_id').eq('assigned_worker_id', user.id).order('created_at', { ascending: false })
    : await supabase.rpc('admin_queue')
  const { data: workers } = await supabase.from('profiles').select('id, full_name').eq('college_id', profile.college_id).eq('role', 'worker').order('full_name')
  return <OperationsClient profile={profile} initialQueue={queue ?? []} workers={workers ?? []} />
}
