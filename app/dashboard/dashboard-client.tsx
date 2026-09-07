'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Building2, Download, LogOut, MapPin, Plus, RefreshCw } from 'lucide-react'

type Building = { id: string; name: string; code: string }
type Location = { id: string; name: string; qr_token: string; building_id: string | null }

type Props = { userId: string; profile: { full_name: string; role: string; college_id: string }; initialBuildings: Building[]; initialLocations: Location[] }

export default function DashboardClient({ profile, initialBuildings, initialLocations }: Props) {
  const [buildings, setBuildings] = useState(initialBuildings)
  const [locations, setLocations] = useState(initialLocations)
  const [buildingName, setBuildingName] = useState('')
  const [buildingCode, setBuildingCode] = useState('')
  const [locationName, setLocationName] = useState('')
  const [selectedBuilding, setSelectedBuilding] = useState('')
  const [message, setMessage] = useState('')
  const supabase = createClient()
  const isAdmin = ['admin', 'super_admin'].includes(profile.role)

  async function addBuilding() {
    if (!buildingName.trim() || !buildingCode.trim()) return
    const { data, error } = await supabase.from('buildings').insert({ college_id: profile.college_id, name: buildingName.trim(), code: buildingCode.trim().toUpperCase() }).select('id, name, code').single()
    if (error) return setMessage('Building could not be added. Admin access is required.')
    setBuildings((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)))
    setBuildingName(''); setBuildingCode(''); setMessage('Building added.')
  }

  async function addLocation() {
    if (!locationName.trim()) return
    const { data, error } = await supabase.from('locations').insert({ college_id: profile.college_id, building_id: selectedBuilding || null, name: locationName.trim(), qr_token: crypto.randomUUID().replaceAll('-', '') }).select('id, name, qr_token, building_id').single()
    if (error) return setMessage('Location could not be added.')
    setLocations((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)))
    setLocationName(''); setMessage('Location added with a unique QR token.')
  }

  async function regenerate(id: string) {
    const { data, error } = await supabase.rpc('regenerate_location_qr', { target_location_id: id })
    if (error) return setMessage('Only college admins can regenerate QR codes.')
    setLocations((current) => current.map((location) => location.id === id ? { ...location, qr_token: data } : location))
    setMessage('QR token regenerated. Previous scans are now inactive.')
  }

  async function signOut() { await supabase.auth.signOut(); window.location.assign('/auth') }

  return <main className="min-h-screen bg-background text-foreground"><header className="border-b border-border bg-card"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10"><div className="flex items-center gap-3"><Image src="/report-and-fix-logo.png" alt="ReportAndFix logo" width={48} height={48} className="h-10 w-10 object-contain" /><div><p className="font-mono text-xs font-bold tracking-[0.16em] text-primary">REPORT<span className="text-brand-green">ANDFIX</span></p><p className="text-xs text-muted-foreground">Operations workspace</p></div></div><nav className="flex items-center gap-2"><a href="/operations" className="rounded-full border border-border px-3 py-2 text-sm font-semibold hover:bg-muted">Operations</a>{isAdmin && <a href="/analytics" className="rounded-full border border-border px-3 py-2 text-sm font-semibold hover:bg-muted">Analytics</a>}{isAdmin && <a href="/staff" className="rounded-full border border-border px-3 py-2 text-sm font-semibold hover:bg-muted">Staff</a>}<button onClick={signOut} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"><LogOut className="h-4 w-4" /> Sign out</button></nav></div></header><div className="mx-auto max-w-7xl px-6 py-10 lg:px-10"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-brand-blue">Phase 2 · Setup</p><h1 className="mt-2 text-4xl font-bold tracking-tight text-primary">Campus hierarchy</h1><p className="mt-2 text-muted-foreground">Welcome, {profile.full_name}. Manage the places your community can report from.</p></div><span className="rounded-full bg-brand-green-soft px-3 py-1.5 text-sm font-semibold text-primary">{profile.role}</span></div>{message && <p role="status" className="mt-6 rounded-xl border border-brand-blue/20 bg-brand-blue-soft px-4 py-3 text-sm text-primary">{message}</p>}{!isAdmin ? <div className="mt-8 rounded-2xl border border-border bg-card p-6"><p className="font-semibold">Admin setup required</p><p className="mt-2 text-sm text-muted-foreground">Your account is ready. A college admin must configure buildings and locations before QR reporting is enabled.</p></div> : <div className="mt-8 grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-border bg-card p-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-brand-blue-soft p-3 text-brand-blue"><Building2 className="h-5 w-5" /></div><div><h2 className="font-bold text-primary">Buildings</h2><p className="text-sm text-muted-foreground">Create the campus structure.</p></div></div><div className="mt-6 flex gap-2"><input value={buildingName} onChange={(e) => setBuildingName(e.target.value)} placeholder="Building name" className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm" /><input value={buildingCode} onChange={(e) => setBuildingCode(e.target.value)} placeholder="Code" className="h-11 w-24 rounded-xl border border-input bg-background px-3 text-sm" /><button onClick={addBuilding} aria-label="Add building" className="rounded-xl bg-primary px-3 text-primary-foreground"><Plus className="h-5 w-5" /></button></div><div className="mt-5 space-y-2">{buildings.map((building) => <div key={building.id} className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3 text-sm"><span className="font-semibold">{building.name}</span><span className="font-mono text-xs text-muted-foreground">{building.code}</span></div>)}{!buildings.length && <p className="py-4 text-sm text-muted-foreground">No buildings yet.</p>}</div></section><section className="rounded-2xl border border-border bg-card p-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-brand-green-soft p-3 text-brand-green"><MapPin className="h-5 w-5" /></div><div><h2 className="font-bold text-primary">Report locations</h2><p className="text-sm text-muted-foreground">Each location gets its own QR token.</p></div></div><div className="mt-6 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="Location name" className="h-11 rounded-xl border border-input bg-background px-3 text-sm" /><select value={selectedBuilding} onChange={(e) => setSelectedBuilding(e.target.value)} className="h-11 rounded-xl border border-input bg-background px-3 text-sm"><option value="">No building</option>{buildings.map((building) => <option key={building.id} value={building.id}>{building.name}</option>)}</select><button onClick={addLocation} aria-label="Add location" className="rounded-xl bg-primary px-3 text-primary-foreground"><Plus className="h-5 w-5" /></button></div><div className="mt-5 space-y-2">{locations.map((location) => <div key={location.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3 text-sm"><div className="min-w-0"><p className="truncate font-semibold">{location.name}</p><p className="font-mono text-[10px] text-muted-foreground">{location.qr_token.slice(0, 12)}…</p></div><div className="flex shrink-0 gap-1"><a href={`/api/qr-pack?location=${location.id}`} className="rounded-lg p-2 text-brand-blue hover:bg-brand-blue-soft" title="Download QR pack"><Download className="h-4 w-4" /></a><button onClick={() => regenerate(location.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-background" title="Regenerate QR"><RefreshCw className="h-4 w-4" /></button></div></div>)}{!locations.length && <p className="py-4 text-sm text-muted-foreground">No report locations yet.</p>}</div></section></div>}</div></main>
}
