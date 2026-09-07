'use client'
import { Share2 } from 'lucide-react'
export default function ShareButton({publicId}:{publicId:string}){
  async function share(){
    const url=`${window.location.origin}/issues/${publicId}`
    try { if(navigator.share) await navigator.share({title:`ReportAndFix ${publicId}`,url}); else await navigator.clipboard.writeText(url) } catch {}
  }
  return <button type="button" onClick={share} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold"><Share2 className="h-4 w-4" /> Share</button>
}
