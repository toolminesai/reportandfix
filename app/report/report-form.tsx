'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, Send, ThumbsUp } from 'lucide-react'

export type ReportContext = { locationId:string; locationName:string; collegeId:string; categories:{id:string;name:string}[] }
type Duplicate = { id:string; public_id:string; title:string; description:string; similarity:number; vote_count:number }
const MAX_BYTES = 300*1024

async function compressImage(file:File):Promise<File>{
  if(file.size<=MAX_BYTES && ['image/jpeg','image/png','image/webp'].includes(file.type)) return file
  const bitmap = await createImageBitmap(file)
  const maxSide = 1600
  const scale = Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height))
  const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(bitmap.width*scale)); canvas.height=Math.max(1,Math.round(bitmap.height*scale))
  const ctx=canvas.getContext('2d'); if(!ctx) throw new Error('Image processing unavailable')
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close()
  let quality=.86
  for(let i=0;i<12;i++){
    const blob=await new Promise<Blob|null>(r=>canvas.toBlob(r,'image/jpeg',quality)); if(blob && blob.size<=MAX_BYTES) return new File([blob],file.name.replace(/\.[^.]+$/i,'.jpg'),{type:'image/jpeg'})
    quality-=.045
  }
  throw new Error('Could not compress this image below 300 KB. Choose a smaller image.')
}

export default function ReportForm({context}:{context:ReportContext}){
  const supabase=useMemo(()=>createClient(),[]); const router=useRouter()
  const [title,setTitle]=useState(''); const [description,setDescription]=useState(''); const [categoryId,setCategoryId]=useState(context.categories[0]?.id??''); const [priority,setPriority]=useState('medium'); const [anonymous,setAnonymous]=useState(false); const [files,setFiles]=useState<File[]>([])
  const [duplicates,setDuplicates]=useState<Duplicate[]>([]); const [status,setStatus]=useState<{kind:'success'|'error';text:string}|null>(null); const [busy,setBusy]=useState(false)
  async function join(id:string){
    setBusy(true); const {data:{user}}=await supabase.auth.getUser(); if(!user){router.push(`/auth?next=${encodeURIComponent(window.location.pathname+window.location.search)}`);return}
    const {error}=await supabase.from('complaint_votes').insert({complaint_id:id,user_id:user.id}); setBusy(false)
    if(error){setStatus({kind:'error',text:error.code==='23505'?'You have already joined this issue.':'Could not join this issue.'});return}
    setStatus({kind:'success',text:'You joined the existing complaint.'}); setDuplicates([])
  }
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault(); setStatus(null)
    if(title.trim().length<5||description.trim().length<15){setStatus({kind:'error',text:'Add a clear title and at least 15 characters describing the issue.'});return}
    if(!categoryId){setStatus({kind:'error',text:'Select a category.'});return}
    setBusy(true); const {data:{user}}=await supabase.auth.getUser(); if(!user){setBusy(false);router.push(`/auth?next=${encodeURIComponent(window.location.pathname+window.location.search)}`);return}
    const {data:dupes,error:dupError}=await supabase.rpc('find_duplicate_complaints',{p_location_id:context.locationId,p_category_id:categoryId,p_title:title.trim(),p_description:description.trim()})
    if(dupError){setBusy(false);setStatus({kind:'error',text:'Duplicate check failed. Please try again.'});return}
    if((dupes??[]).length){setDuplicates(dupes as Duplicate[]);setBusy(false);return}
    await createComplaint(user.id)
  }
  async function createComplaint(userId:string){
    try{
      const prepared:File[]=[]; for(const file of files.slice(0,5)) prepared.push(await compressImage(file))
      const {data:complaint,error}=await supabase.rpc('create_complaint',{p_title:title.trim(),p_description:description.trim(),p_college_id:context.collegeId,p_reporter_id:userId,p_category_id:categoryId,p_location_id:context.locationId,p_priority:priority,p_is_anonymous:anonymous})
      if(error||!complaint) throw new Error(error?.message||'Could not create report')
      for(const file of prepared){
        const form=new FormData(); form.append('complaintId',complaint.id); form.append('mediaType','before'); form.append('file',file)
        const response=await fetch('/api/media/upload',{method:'POST',body:form}); if(!response.ok){const data=await response.json().catch(()=>({})); throw new Error(data.error||'Image upload failed')}
      }
      setStatus({kind:'success',text:`Report ${complaint.public_id} submitted. You can track its progress from My reports.`}); setTitle('');setDescription('');setFiles([]);setDuplicates([])
    }catch(error){setStatus({kind:'error',text:error instanceof Error?error.message:'We could not submit your report.'})}
    finally{setBusy(false)}
  }
  return <form onSubmit={submit} className="space-y-5" noValidate>
    <div><label htmlFor="report-title" className="text-sm font-semibold text-primary">What needs attention?</label><input id="report-title" maxLength={140} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Water leak near the library" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-primary focus:ring-2" required /></div>
    <div><label htmlFor="report-description" className="text-sm font-semibold text-primary">Describe the issue</label><textarea id="report-description" maxLength={3000} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Include useful details such as exact area, urgency, and what you observed." className="mt-2 min-h-32 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-primary focus:ring-2" required /><p className="mt-1 text-right text-xs text-muted-foreground">{description.length}/3000</p></div>
    <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="report-category" className="text-sm font-semibold text-primary">Category</label><select id="report-category" value={categoryId} onChange={e=>setCategoryId(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm">{context.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><label htmlFor="report-priority" className="text-sm font-semibold text-primary">Priority</label><select id="report-priority" value={priority} onChange={e=>setPriority(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div></div>
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm"><input type="checkbox" checked={anonymous} onChange={e=>setAnonymous(e.target.checked)} className="h-4 w-4 accent-primary" /> Submit anonymously to other campus users</label>
    <div><label htmlFor="report-files" className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border px-4 py-4 text-sm text-muted-foreground hover:bg-muted"><ImagePlus className="h-5 w-5 text-brand-blue" /><span>{files.length?`${files.length} image${files.length===1?'':'s'} selected`:'Attach up to 5 supporting images (max 300 KB each)'}</span></label><input id="report-files" type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={e=>setFiles(Array.from(e.target.files??[]).slice(0,5))}/></div>
    {duplicates.length>0 && <section className="rounded-2xl border border-brand-blue/20 bg-brand-blue-soft p-4"><p className="font-semibold text-primary">This may already be reported</p><p className="mt-1 text-sm text-muted-foreground">These are live matches from the same location and category.</p><div className="mt-3 space-y-2">{duplicates.map(d=><div key={d.id} className="rounded-xl border border-border bg-card p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs font-bold text-brand-blue">{d.public_id} · {Math.round(d.similarity*100)}% similar</p><p className="mt-1 font-semibold">{d.title}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.description}</p></div><button type="button" disabled={busy} onClick={()=>join(d.id)} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"><ThumbsUp className="h-3.5 w-3.5"/> Join</button></div></div>)}</div><button type="button" disabled={busy} onClick={async()=>{const {data:{user}}=await supabase.auth.getUser();if(user) await createComplaint(user.id);else router.push(`/auth?next=${encodeURIComponent(window.location.pathname+window.location.search)}`)}} className="mt-3 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold">None match — submit as a new issue</button></section>}
    {status && <p role="status" className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${status.kind==='success'?'bg-brand-green-soft text-primary':'bg-destructive/10 text-destructive'}`}>{status.kind==='success'?<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0"/>:<AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/>}{status.text}</p>}
    <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>} Submit report</button>
  </form>
}
