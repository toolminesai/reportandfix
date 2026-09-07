import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: actor } = await supabase.from('profiles').select('role, college_id').eq('id', user.id).single()
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const role = body.role as 'admin' | 'worker'
  const collegeId = actor.role === 'super_admin' ? body.collegeId : actor.college_id
  if (!['admin', 'worker'].includes(role) || !collegeId || !body.email || !body.fullName) {
    return NextResponse.json({ error: 'Name, email, role, and college are required.' }, { status: 400 })
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
  const temporaryPassword = body.password || `${crypto.randomUUID().slice(0, 8)}Aa!9`
  const { data: created, error } = await admin.auth.admin.createUser({ email: body.email, password: temporaryPassword, email_confirm: true, user_metadata: { full_name: body.fullName } })
  if (error || !created.user) return NextResponse.json({ error: 'Unable to create account.' }, { status: 400 })

  const { error: profileError } = await admin.from('profiles').upsert({ id: created.user.id, college_id: collegeId, full_name: body.fullName, role })
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id)
    return NextResponse.json({ error: 'Unable to create staff profile.' }, { status: 400 })
  }
  return NextResponse.json({ email: body.email, temporaryPassword })
}
