import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const params = new URL(request.url).searchParams
  const locationIds = (params.get('locations') || params.get('location') || '').split(',').map(v => v.trim()).filter(Boolean)
  if (!locationIds.length) return NextResponse.json({ error: 'Location is required' }, { status: 400 })
  const { data: locations, error: locationsError } = await supabase.from('locations').select('id,name,qr_token,college_id,location_code').in('id', locationIds)
  if (locationsError || !locations?.length) return NextResponse.json({ error: 'Location not found' }, { status: 404 })
  const { data: profile } = await supabase.from('profiles').select('role, college_id').eq('id', user.id).maybeSingle()
  if (!profile || !['admin','super_admin'].includes(profile.role) || locations.some(l => profile.role !== 'super_admin' && l.college_id !== profile.college_id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const origin = new URL(request.url).origin
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const cardWidth = 250, cardHeight = 350
  const positions = [[35,455],[310,455],[35,35],[310,35]]
  for (let pageIndex = 0; pageIndex < locations.length; pageIndex += 4) {
    const page = pdf.addPage([595.28,841.89])
    const chunk = locations.slice(pageIndex,pageIndex+4)
    for (let i=0;i<chunk.length;i++) {
      const location=chunk[i], [x,y]=positions[i]
      const qrPng=await QRCode.toDataURL(`${origin}/report/${location.qr_token}`,{width:900,margin:2,errorCorrectionLevel:'H'})
      const image=await pdf.embedPng(qrPng)
      page.drawRectangle({x,y,width:cardWidth,height:cardHeight,borderWidth:1,borderColor:rgb(.82,.86,.9)})
      page.drawText('REPORTANDFIX',{x:x+18,y:y+cardHeight-32,size:11,font,color:rgb(.05,.13,.24)})
      page.drawText('Scan to report an issue',{x:x+18,y:y+cardHeight-53,size:9,font:regular,color:rgb(.3,.36,.42)})
      page.drawImage(image,{x:x+31,y:y+68,width:188,height:188})
      page.drawText(location.name.slice(0,32),{x:x+18,y:y+42,size:11,font,color:rgb(.05,.13,.24),maxWidth:210})
      page.drawText(`${location.location_code || 'Location'} · ${location.qr_token.slice(0,10)}`,{x:x+18,y:y+23,size:7,font:regular,color:rgb(.42,.47,.52)})
    }
  }
  const bytes=await pdf.save()
  const safe=locations.length===1?locations[0].name.toLowerCase().replace(/[^a-z0-9]+/g,'-'):'locations'
  return new NextResponse(Buffer.from(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="reportandfix-${safe}-qr-pack.pdf"`,'Cache-Control':'no-store'}})

}
