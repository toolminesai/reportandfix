import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/auth?error=confirmation', url.origin))
  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent('confirmation')}`, url.origin))
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth?error=confirmation', url.origin))
  const { data: profile, error: profileError } = await supabase.from('profiles').select('role,is_suspended').eq('id', user.id).maybeSingle()
  if (profileError || !profile || profile.is_suspended) return NextResponse.redirect(new URL('/auth?error=account', url.origin))
  const destination = profile.role === 'super_admin' ? '/staff' : profile.role === 'worker' ? '/operations' : '/dashboard'
  return NextResponse.redirect(new URL(destination, url.origin))
}
