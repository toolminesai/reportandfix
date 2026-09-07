import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

async function getActor() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: actor } = await supabase.from('profiles').select('id,role,college_id').eq('id',user.id).single()
  return actor ? { user, actor } : null
}

export async function POST(request: Request) {
  const auth = await getActor()
  if (!auth || !['admin','super_admin'].includes(auth.actor.role)) return NextResponse.json({error:'Forbidden'},{status:403})
  const body = await request.json()
  const role = body.role as 'admin'|'worker'
  const collegeId = auth.actor.role === 'super_admin' ? body.collegeId : auth.actor.college_id
  if (!['admin','worker'].includes(role) || !collegeId || !body.email || !body.fullName) return NextResponse.json({error:'Name, email, role, and college are required.'},{status:400})
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{autoRefreshToken:false,persistSession:false}})
  const temporaryPassword = body.password || `${crypto.randomUUID().slice(0,8)}Aa!9`
  const {data:created,error} = await admin.auth.admin.createUser({email:String(body.email).trim(),password:temporaryPassword,email_confirm:true,user_metadata:{full_name:String(body.fullName).trim()}})
  if (error || !created.user) return NextResponse.json({error:error?.message || 'Unable to create account.'},{status:400})
  const {error:profileError} = await admin.from('profiles').upsert({id:created.user.id,college_id:collegeId,full_name:String(body.fullName).trim(),role})
  if (profileError) { await admin.auth.admin.deleteUser(created.user.id); return NextResponse.json({error:'Unable to create staff profile.'},{status:400}) }
  return NextResponse.json({email:body.email,temporaryPassword})
}

export async function PATCH(request: Request) {
  const auth = await getActor()
  if (!auth || !['admin','super_admin'].includes(auth.actor.role)) return NextResponse.json({error:'Forbidden'},{status:403})
  const body = await request.json(); if (!body.userId || !body.password) return NextResponse.json({error:'User and password are required.'},{status:400})
  const supabase = await createServerClient(); const {data:target} = await supabase.from('profiles').select('id,college_id,role').eq('id',body.userId).maybeSingle()
  if (!target || (auth.actor.role !== 'super_admin' && target.college_id !== auth.actor.college_id)) return NextResponse.json({error:'Forbidden'},{status:403})
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{autoRefreshToken:false,persistSession:false}})
  const {error} = await admin.auth.admin.updateUserById(body.userId,{password:String(body.password)})
  return error ? NextResponse.json({error:'Password reset failed.'},{status:400}) : NextResponse.json({ok:true})
}
