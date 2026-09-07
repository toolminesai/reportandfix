import { redirect } from 'next/navigation'
export default async function QRReportPage({params}:{params:Promise<{qrToken:string}>}){ const {qrToken}=await params; redirect(`/report?location=${encodeURIComponent(qrToken)}`) }
