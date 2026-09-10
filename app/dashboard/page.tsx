import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  const { data: profile } = await supabase.from('profiles').select('full_name, role, college_id, is_suspended').eq('id', user.id).maybeSingle()
  if (!profile) redirect('/auth?error=account')
  if (profile.is_suspended) redirect('/auth?error=suspended')
  if (profile.role === 'worker') redirect('/operations')
  if (profile.role === 'super_admin') redirect('/staff')
  if (profile.role === 'admin') redirect('/dashboard')
  const { data: buildings } = await supabase.from('buildings').select('id, name, code').eq('college_id', profile.college_id).order('name')
  const [{ data: floors }, { data: locations }] = await Promise.all([supabase.from('floors').select('id, building_id, name, floor_number').order('floor_number'), supabase.from('locations').select('id, name, qr_token, building_id, floor_id, location_code, location_type, active').eq('college_id', profile.college_id).order('name')])
  return <DashboardClient userId={user.id} profile={profile} initialBuildings={buildings ?? []} initialFloors={floors ?? []} initialLocations={locations ?? []} />
}
