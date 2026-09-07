import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const locationId = new URL(request.url).searchParams.get('location')
  if (!locationId) return NextResponse.json({ error: 'Location is required' }, { status: 400 })
  const { data: location, error } = await supabase.from('locations').select('id, name, qr_token, college_id').eq('id', locationId).maybeSingle()
  if (error || !location) return NextResponse.json({ error: 'Location not found' }, { status: 404 })
  const { data: profile } = await supabase.from('profiles').select('role, college_id').eq('id', user.id).maybeSingle()
  if (!profile || profile.college_id !== location.college_id || !['admin', 'super_admin'].includes(profile.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const origin = new URL(request.url).origin
  const qrPng = await QRCode.toDataURL(`${origin}/report?location=${location.qr_token}`, { width: 900, margin: 2, errorCorrectionLevel: 'H' })
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595.28, 841.89])
  const image = await pdf.embedPng(qrPng)
  const font = await pdf.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const cardWidth = 250
  const cardHeight = 350
  const positions = [[35, 455], [310, 455], [35, 35], [310, 35]]
  positions.forEach(([x, y], index) => {
    page.drawRectangle({ x, y, width: cardWidth, height: cardHeight, borderWidth: 1, borderColor: rgb(0.82, 0.86, 0.9) })
    page.drawText('REPORTANDFIX', { x: x + 18, y: y + cardHeight - 32, size: 11, font, color: rgb(0.05, 0.13, 0.24) })
    page.drawText('Scan to report an issue', { x: x + 18, y: y + cardHeight - 53, size: 9, font: regular, color: rgb(0.3, 0.36, 0.42) })
    page.drawImage(image, { x: x + 31, y: y + 68, width: 188, height: 188 })
    page.drawText(location.name.slice(0, 32), { x: x + 18, y: y + 42, size: 11, font, color: rgb(0.05, 0.13, 0.24), maxWidth: 210 })
    page.drawText(`Copy ${index + 1} · ${location.qr_token.slice(0, 10)}`, { x: x + 18, y: y + 23, size: 7, font: regular, color: rgb(0.42, 0.47, 0.52) })
  })
  const bytes = await pdf.save()
  return new NextResponse(Buffer.from(bytes), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="reportandfix-${location.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-qr-pack.pdf"`, 'Cache-Control': 'no-store' } })
}
