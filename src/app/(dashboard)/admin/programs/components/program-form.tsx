'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CalendarRange, Save } from 'lucide-react'
import { createProgramAction } from '@/features/programs/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Unit = { id: string; name: string; code: string }
type Period = { id: string; name: string; status: string }
type Member = { id: string; fullName: string; membershipStatus: string }

export function ProgramForm({ units, periods, members }: { units: Unit[]; periods: Period[]; members: Member[] }) {
  const router = useRouter()
  const [requiresRegistration, setRequiresRegistration] = useState(false)
  const [campaignEnabled, setCampaignEnabled] = useState(false)
  const [featured, setFeatured] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(formData: FormData) {
    setIsSubmitting(true)
    setError('')
    const result = await createProgramAction({
      name: value(formData, 'name'),
      organizationalUnitId: value(formData, 'organizationalUnitId'),
      periodId: value(formData, 'periodId'),
      description: value(formData, 'description'),
      fullName: value(formData, 'fullName'),
      objective: value(formData, 'objective'),
      targetAudience: value(formData, 'targetAudience'),
      method: value(formData, 'method'),
      output: value(formData, 'output'),
      picId: value(formData, 'picId'),
      plannedStart: value(formData, 'plannedStart'),
      plannedEnd: value(formData, 'plannedEnd'),
      location: value(formData, 'location'),
      plannedBudget: value(formData, 'plannedBudget'),
      visibility: value(formData, 'visibility'),
      campaignEnabled,
      featured,
      requiresRegistration,
      registrationType: requiresRegistration ? value(formData, 'registrationType') : null,
    })
    setIsSubmitting(false)
    if (!result.success || !result.data) {
      setError(result.error ?? 'Program belum dapat disimpan.')
      return
    }
    router.push(`/admin/programs/${result.data.id}`)
    router.refresh()
  }

  const disabled = isSubmitting || units.length === 0 || periods.length === 0

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-card p-6 text-surface shadow-card">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-surface/70">Manajemen organisasi</p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold">Buat Program</h1>
        <p className="mt-2 text-sm leading-6 text-surface/80">Program adalah satu entitas. Agenda dikelola melalui modul Agenda terpisah.</p>
      </div>

      {error ? <div role="alert" className="flex gap-2 rounded-2xl border border-danger/25 bg-danger/10 p-4 text-sm font-semibold text-primary"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div> : null}
      {units.length === 0 || periods.length === 0 ? <div role="alert" className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-primary">Buat atau aktifkan Unit Organisasi dan Periode terlebih dahulu melalui CMS Organisasi.</div> : null}

      <form action={submit} className="space-y-5">
        <Card><CardHeader><CardTitle>Identitas program</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Unit Organisasi" htmlFor="organizationalUnitId"><select id="organizationalUnitId" name="organizationalUnitId" defaultValue={units[0]?.id ?? ''} disabled={disabled} className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-primary">{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></Field>
          <Field label="Nama Program" htmlFor="name"><Input id="name" name="name" required disabled={disabled} placeholder="Contoh: IKMI SOSIAL" /></Field>
          <Field label="Nama Lengkap" htmlFor="fullName"><Input id="fullName" name="fullName" disabled={disabled} placeholder="Opsional" /></Field>
          <Field label="Periode" htmlFor="periodId"><select id="periodId" name="periodId" defaultValue={periods.find((period) => period.status === 'ACTIVE')?.id ?? periods[0]?.id ?? ''} disabled={disabled} className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-primary">{periods.map((period) => <option key={period.id} value={period.id}>{period.name} ({periodStatusLabel(period.status)})</option>)}</select></Field>
          <Field label="PIC" htmlFor="picId"><select id="picId" name="picId" defaultValue="" disabled={disabled} className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-primary"><option value="">Belum ditentukan</option>{members.map((member) => <option key={member.id} value={member.id}>{member.fullName} ({member.membershipStatus})</option>)}</select></Field>
          <div className="md:col-span-2"><Field label="Deskripsi / Latar Belakang" htmlFor="description"><Textarea id="description" name="description" required disabled={disabled} rows={4} placeholder="Jelaskan latar belakang program." /></Field></div>
          <Field label="Tujuan" htmlFor="objective"><Textarea id="objective" name="objective" disabled={disabled} rows={3} placeholder="Opsional" /></Field>
          <Field label="Sasaran" htmlFor="targetAudience"><Textarea id="targetAudience" name="targetAudience" disabled={disabled} rows={3} placeholder="Opsional" /></Field>
          <Field label="Bentuk / Metode" htmlFor="method"><Textarea id="method" name="method" disabled={disabled} rows={3} placeholder="Opsional" /></Field>
          <Field label="Output" htmlFor="output"><Textarea id="output" name="output" disabled={disabled} rows={3} placeholder="Opsional" /></Field>
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarRange className="h-5 w-5" />Rencana, publikasi & pendaftaran</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Tanggal rencana mulai" htmlFor="plannedStart"><Input id="plannedStart" name="plannedStart" type="date" disabled={disabled} /></Field>
          <Field label="Tanggal rencana selesai" htmlFor="plannedEnd"><Input id="plannedEnd" name="plannedEnd" type="date" disabled={disabled} /></Field>
          <Field label="Lokasi" htmlFor="location"><Input id="location" name="location" disabled={disabled} placeholder="Opsional" /></Field>
          <Field label="Anggaran rencana (Rp)" htmlFor="plannedBudget"><Input id="plannedBudget" name="plannedBudget" type="number" min="1" disabled={disabled} placeholder="Kosongkan bila belum diverifikasi" /></Field>
          <Field label="Visibilitas" htmlFor="visibility"><select id="visibility" name="visibility" defaultValue="HIDDEN" disabled={disabled} className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-primary"><option value="HIDDEN">Disembunyikan</option><option value="INTERNAL">Internal</option><option value="PUBLIC">Publik</option></select></Field>
          <div className="grid gap-3 md:col-span-2 md:grid-cols-2"><label className="flex items-center gap-3 rounded-xl border border-border bg-surface-alt p-4 text-sm font-semibold text-primary"><input type="checkbox" checked={campaignEnabled} onChange={(event) => setCampaignEnabled(event.target.checked)} disabled={disabled} className="h-4 w-4" />Aktifkan campaign beranda bila diperlukan.</label><label className="flex items-center gap-3 rounded-xl border border-border bg-surface-alt p-4 text-sm font-semibold text-primary"><input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} disabled={disabled} className="h-4 w-4" />Tandai sebagai Program unggulan.</label></div>
          <label className="flex items-center gap-3 rounded-xl border border-border bg-surface-alt p-4 text-sm font-semibold text-primary md:col-span-2"><input type="checkbox" checked={requiresRegistration} onChange={(event) => setRequiresRegistration(event.target.checked)} disabled={disabled} className="h-4 w-4" />Program ini memerlukan pendaftaran.</label>
          {requiresRegistration ? <Field label="Jenis pendaftaran" htmlFor="registrationType"><select id="registrationType" name="registrationType" defaultValue="GENERAL_REGISTRATION" disabled={disabled} className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-primary"><option value="GENERAL_REGISTRATION">Pendaftaran umum</option><option value="MEMBERSHIP_RECRUITMENT">Rekrutmen anggota</option><option value="INTERNAL_REGISTRATION">Pendaftaran internal</option><option value="EXTERNAL_LINK">Tautan eksternal</option></select></Field> : null}
        </CardContent></Card>

        <div className="flex justify-end"><Button type="submit" disabled={disabled}><Save className="mr-2 h-4 w-4" />{isSubmitting ? 'Menyimpan…' : 'Simpan Program'}</Button></div>
      </form>
    </div>
  )
}

function value(formData: FormData, name: string) { return String(formData.get(name) ?? '') }
function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) { return <div className="space-y-2"><label htmlFor={htmlFor} className="text-sm font-semibold text-primary">{label}</label>{children}</div> }
function periodStatusLabel(status: string) { return ({ ACTIVE: 'Aktif', DRAFT: 'Draft', ARCHIVED: 'Arsip' } as Record<string, string>)[status] ?? status }
