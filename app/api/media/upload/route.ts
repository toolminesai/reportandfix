import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const MAX_BYTES = 300 * 1024
const TYPES = new Set(['image/jpeg','image/png','image/webp'])

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const form = await request.formData()
  const complaintId = String(form.get('complaintId') || '')
  const mediaType = String(form.get('mediaType') || 'before')
  const file = form.get('file')
  if (!(file instanceof File) || !complaintId || !['before','after'].includes(mediaType)) return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 })
  if (!TYPES.has(file.type) || file.size > MAX_BYTES) return NextResponse.json({ error: 'Images must be JPG, PNG, or WebP and no larger than 300 KB.' }, { status: 400 })
  const { data: complaint } = await supabase.from('complaints').select('id,reporter_id,assigned_worker_id,college_id').eq('id', complaintId).maybeSingle()
  if (!complaint || (complaint.reporter_id !== user.id && complaint.assigned_worker_id !== user.id)) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken:false, persistSession:false } })
  const path = `${user.id}/${complaintId}/${crypto.randomUUID()}.${file.type.split('/')[1]}`
  const upload = await admin.storage.from('complaint-media').upload(path, file, { contentType:file.type, upsert:false })
  if (upload.error) return NextResponse.json({ error:'Upload failed.' }, { status:500 })
  const { error } = await admin.from('complaint_media').insert({ complaint_id:complaintId, uploaded_by:user.id, storage_path:path, media_type:mediaType, authenticity_status:'review' })
  if (error) { await admin.storage.from('complaint-media').remove([path]); return NextResponse.json({ error:'Could not save media.' }, { status:500 }) }
  return NextResponse.json({ path })
}
