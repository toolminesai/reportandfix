import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StaffClient from './staff-client'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  const { data: profile } = await supabase.from('profiles').select('role, college_id').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/dashboard')
  const { data: colleges } = profile.role === 'super_admin' ? await supabase.from('colleges').select('id,name,is_active').order('name') : { data: [] }
  return <StaffClient role={profile.role} colleges={colleges ?? []} />
}
