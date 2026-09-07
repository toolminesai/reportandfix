import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
export async function PATCH(request:Request){
 const supabase=await createServerClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
 const {data:actor}=await supabase.from('profiles').select('role').eq('id',user.id).single(); if(actor?.role!=='super_admin')return NextResponse.json({error:'Forbidden'},{status:403})
 const body=await request.json(); if(!body.collegeId)return NextResponse.json({error:'College is required.'},{status:400})
 const {error}=await supabase.rpc('set_college_status',{p_college_id:body.collegeId,p_active:Boolean(body.active)}); if(error)return NextResponse.json({error:error.message},{status:400}); return NextResponse.json({ok:true})
}
