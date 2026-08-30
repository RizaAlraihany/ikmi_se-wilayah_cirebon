'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, Save } from 'lucide-react'
import { archiveProgramAction, updateProgramAction } from '@/features/programs/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Unit = { id: string; name: string }
type Period = { id: string; name: string; status: string }
type Member = { id: string; fullName: string; membershipStatus: string }
type Program = { id: string; name: string; fullName: string | null; description: string; objective: string | null; targetAudience: string | null; method: string | null; output: string | null; departmentId: string; periodId: string | null; picId: string | null; plannedStart: string; plannedEnd: string; location: string | null; plannedBudget: string; visibility: string; campaignEnabled: boolean; featured: boolean; requiresRegistration: boolean | null; registrationType: string | null }

export function ProgramEditor({ program, units, periods, members }: { program: Program; units: Unit[]; periods: Period[]; members: Member[] }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [requiresRegistration, setRequiresRegistration] = useState(Boolean(program.requiresRegistration))
  const [campaignEnabled, setCampaignEnabled] = useState(program.campaignEnabled)
  const [featured, setFeatured] = useState(program.featured)

  async function submit(formData: FormData) {
    setSaving(true)
    const result = await updateProgramAction(program.id, {
      name: text(formData, 'name'), fullName: text(formData, 'fullName'), description: text(formData, 'description'), objective: text(formData, 'objective'),
      targetAudience: text(formData, 'targetAudience'), method: text(formData, 'method'), output: text(formData, 'output'), organizationalUnitId: text(formData, 'organizationalUnitId'),
      periodId: text(formData, 'periodId'), picId: text(formData, 'picId'), plannedStart: text(formData, 'plannedStart'), plannedEnd: text(formData, 'plannedEnd'), location: text(formData, 'location'),
      plannedBudget: text(formData, 'plannedBudget'), visibility: text(formData, 'visibility'), campaignEnabled, featured, requiresRegistration, registrationType: requiresRegistration ? text(formData, 'registrationType') : null,
    })
    setMessage(result.error ?? 'Data program diperbarui.')
    setSaving(false)
    if (result.success) router.refresh()
  }

  async function archive() {
    if (!window.confirm('Arsipkan Program ini? Data tidak dihapus permanen.')) return
    setSaving(true)
    const result = await archiveProgramAction(program.id)
    setSaving(false)
    if (!result.success) {
      setMessage(result.error ?? 'Program belum dapat diarsipkan.')
      return
    }
    router.push('/admin/programs')
    router.refresh()
  }

  return <details className="rounded-2xl border border-border bg-surface"><summary className="cursor-pointer px-5 py-4 font-heading font-bold text-primary">Edit data Program</summary><form action={submit} className="grid gap-4 border-t border-border p-5 md:grid-cols-2"><Field label="Nama"><Input name="name" defaultValue={program.name} required disabled={saving} /></Field><Field label="Nama lengkap"><Input name="fullName" defaultValue={program.fullName ?? ''} disabled={saving} /></Field><Field label="Unit organisasi"><select name="organizationalUnitId" defaultValue={program.departmentId} disabled={saving} className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-primary">{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></Field><Field label="Periode"><select name="periodId" defaultValue={program.periodId ?? ''} disabled={saving} className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-primary"><option value="">Belum ditentukan</option>{periods.map((period) => <option key={period.id} value={period.id}>{period.name} ({periodStatusLabel(period.status)})</option>)}</select></Field><Field label="PIC"><select name="picId" defaultValue={program.picId ?? ''} disabled={saving} className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-primary"><option value="">Belum ditentukan</option>{members.map((member) => <option key={member.id} value={member.id}>{member.fullName} ({member.membershipStatus})</option>)}</select></Field><Field label="Lokasi"><Input name="location" defaultValue={program.location ?? ''} disabled={saving} placeholder="Opsional" /></Field><Field label="Anggaran rencana (Rp)"><Input name="plannedBudget" type="number" min="1" defaultValue={program.plannedBudget} placeholder="Belum diverifikasi" disabled={saving} /></Field><Field label="Rencana mulai"><Input name="plannedStart" type="date" defaultValue={program.plannedStart} disabled={saving} /></Field><Field label="Rencana selesai"><Input name="plannedEnd" type="date" defaultValue={program.plannedEnd} disabled={saving} /></Field><Field label="Visibilitas"><select name="visibility" defaultValue={program.visibility || 'HIDDEN'} disabled={saving} className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-primary"><option value="HIDDEN">Disembunyikan</option><option value="INTERNAL">Internal</option><option value="PUBLIC">Publik</option></select></Field><div className="grid gap-3 md:col-span-2 md:grid-cols-2"><label className="flex items-center gap-3 rounded-xl border border-border bg-surface-alt p-4 text-sm font-semibold text-primary"><input type="checkbox" checked={campaignEnabled} onChange={(event) => setCampaignEnabled(event.target.checked)} disabled={saving} />Aktifkan campaign beranda.</label><label className="flex items-center gap-3 rounded-xl border border-border bg-surface-alt p-4 text-sm font-semibold text-primary"><input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} disabled={saving} />Tandai sebagai Program unggulan.</label></div><label className="flex items-center gap-3 rounded-xl border border-border bg-surface-alt p-4 text-sm font-semibold text-primary md:col-span-2"><input type="checkbox" checked={requiresRegistration} onChange={(event) => setRequiresRegistration(event.target.checked)} disabled={saving} />Memerlukan pendaftaran</label>{requiresRegistration ? <Field label="Jenis pendaftaran"><select name="registrationType" defaultValue={program.registrationType ?? 'GENERAL_REGISTRATION'} disabled={saving} className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-primary"><option value="GENERAL_REGISTRATION">Pendaftaran umum</option><option value="MEMBERSHIP_RECRUITMENT">Rekrutmen anggota</option><option value="INTERNAL_REGISTRATION">Pendaftaran internal</option><option value="EXTERNAL_LINK">Tautan eksternal</option></select></Field> : null}<div className="md:col-span-2"><Field label="Deskripsi"><Textarea name="description" defaultValue={program.description} rows={4} required disabled={saving} /></Field></div><Field label="Tujuan"><Textarea name="objective" defaultValue={program.objective ?? ''} rows={3} disabled={saving} /></Field><Field label="Sasaran"><Textarea name="targetAudience" defaultValue={program.targetAudience ?? ''} rows={3} disabled={saving} /></Field><Field label="Bentuk / metode"><Textarea name="method" defaultValue={program.method ?? ''} rows={3} disabled={saving} /></Field><Field label="Output"><Textarea name="output" defaultValue={program.output ?? ''} rows={3} disabled={saving} /></Field><div className="flex flex-wrap items-center gap-3 md:col-span-2"><Button type="submit" size="sm" disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? 'Menyimpan…' : 'Simpan perubahan'}</Button><Button type="button" size="sm" variant="outline" disabled={saving} onClick={archive}><Archive className="mr-2 h-4 w-4" />Arsipkan Program</Button>{message ? <p role="status" className="text-sm font-medium text-text-secondary">{message}</p> : null}</div></form></details>
}

function text(formData: FormData, name: string) { return String(formData.get(name) ?? '') }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-2 text-sm font-semibold text-primary"><span>{label}</span>{children}</label> }
function periodStatusLabel(status: string) { return ({ ACTIVE: 'Aktif', DRAFT: 'Draft', ARCHIVED: 'Arsip' } as Record<string, string>)[status] ?? status }
