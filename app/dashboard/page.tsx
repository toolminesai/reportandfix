import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  const { data: profile } = await supabase.from('profiles').select('full_name, role, college_id').eq('id', user.id).maybeSingle()
  if (!profile) redirect('/auth')
  const { data: buildings } = await supabase.from('buildings').select('id, name, code').eq('college_id', profile.college_id).order('name')
  const { data: locations } = await supabase.from('locations').select('id, name, qr_token, building_id').eq('college_id', profile.college_id).order('name')
  return <DashboardClient userId={user.id} profile={profile} initialBuildings={buildings ?? []} initialLocations={locations ?? []} />
}
