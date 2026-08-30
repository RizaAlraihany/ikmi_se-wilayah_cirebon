'use client'

import { useState } from 'react'
import { Building2, CalendarRange, Plus, UserRoundCog } from 'lucide-react'
import {
  createOrganizationalPositionAction,
  createOrganizationalUnitAction,
  createPeriodAction,
  updateOrganizationalUnitAction,
  updatePeriodAction,
} from '@/features/organization/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Period = { id: string; name: string; cabinetName: string | null; chairmanName: string | null; startDate: Date | null; endDate: Date | null; status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' }
type Unit = {
  id: string; name: string; code: string; description: string | null; email: string | null; headMemberId: string | null; periodId: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'; unitType: 'BPH' | 'SECRETARIAT' | 'TREASURY' | 'DEPARTMENT' | 'DIVISION'
  headMember: { id: string; fullName: string } | null; positions: { id: string; name: string }[]; _count: { users: number; programs: number; agendas: number }
}
type Member = { id: string; fullName: string; membershipStatus: string }

function formValue(formData: FormData, name: string) {
  return String(formData.get(name) ?? '')
}

function formatDateInput(value: Date | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : ''
}

export function OrganizationManager({ periods, units, members }: { periods: Period[]; units: Unit[]; members: Member[] }) {
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function createPeriod(formData: FormData) {
    setIsSaving(true)
    const result = await createPeriodAction({
      name: formValue(formData, 'name'), cabinetName: formValue(formData, 'cabinetName'), chairmanName: formValue(formData, 'chairmanName'),
      startDate: formValue(formData, 'startDate'), endDate: formValue(formData, 'endDate'), status: formValue(formData, 'status') as 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
    })
    setMessage(result.error ?? 'Periode berhasil disimpan.')
    setIsSaving(false)
  }

  async function savePeriod(id: string, formData: FormData) {
    setIsSaving(true)
    const result = await updatePeriodAction(id, {
      name: formValue(formData, 'name'), cabinetName: formValue(formData, 'cabinetName'), chairmanName: formValue(formData, 'chairmanName'),
      startDate: formValue(formData, 'startDate'), endDate: formValue(formData, 'endDate'), status: formValue(formData, 'status') as 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
    })
    setMessage(result.error ?? 'Periode berhasil diperbarui.')
    setIsSaving(false)
  }

  async function createUnit(formData: FormData) {
    setIsSaving(true)
    const result = await createOrganizationalUnitAction(readUnitInput(formData))
    setMessage(result.error ?? 'Unit organisasi berhasil dibuat.')
    setIsSaving(false)
  }

  async function saveUnit(id: string, formData: FormData) {
    setIsSaving(true)
    const result = await updateOrganizationalUnitAction(id, readUnitInput(formData))
    setMessage(result.error ?? 'Unit organisasi berhasil diperbarui.')
    setIsSaving(false)
  }

  async function createPosition(formData: FormData) {
    setIsSaving(true)
    const result = await createOrganizationalPositionAction({ name: formValue(formData, 'name'), departmentId: formValue(formData, 'departmentId') })
    setMessage(result.error ?? 'Jabatan berhasil dibuat.')
    setIsSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-card p-6 text-surface shadow-card">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-surface/70">CMS organisasi</p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold">Periode & Unit Organisasi</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-surface/80">Kelola struktur dasar yang dipakai Program, Agenda, jabatan, pengurus, dan arsip dokumen. Perubahan dicatat pada audit log.</p>
      </div>

      {message ? <p role="status" className="rounded-xl border border-border bg-surface-alt px-4 py-3 text-sm font-semibold text-primary">{message}</p> : null}

      <section className="grid gap-5 xl:grid-cols-[1fr_1.15fr]">
        <Card id="periode" className="scroll-mt-24">
          <CardHeader><CardTitle className="flex items-center gap-2"><CalendarRange className="h-5 w-5" />Tambah Periode</CardTitle></CardHeader>
          <CardContent>
            <form action={createPeriod} className="grid gap-3">
              <Input name="name" required placeholder="Contoh: Kepengurusan 2028–2029" disabled={isSaving} aria-label="Nama periode" />
              <Input name="cabinetName" placeholder="Nama kabinet (opsional)" disabled={isSaving} aria-label="Nama kabinet" />
              <Input name="chairmanName" placeholder="Ketua (opsional)" disabled={isSaving} aria-label="Nama ketua" />
              <div className="grid grid-cols-2 gap-3"><Input name="startDate" type="date" disabled={isSaving} aria-label="Tanggal mulai" /><Input name="endDate" type="date" disabled={isSaving} aria-label="Tanggal akhir" /></div>
              <select name="status" defaultValue="DRAFT" className="h-11 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-primary" aria-label="Status periode"><option value="DRAFT">Draft</option><option value="ACTIVE">Aktif</option><option value="ARCHIVED">Arsip</option></select>
              <Button type="submit" disabled={isSaving}><Plus className="mr-2 h-4 w-4" />Simpan periode</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Periode tersimpan</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {periods.map((period) => <details key={period.id} className="rounded-xl border border-border bg-surface-alt p-3"><summary className="cursor-pointer font-semibold text-primary">{period.name} <span className="ml-2 text-xs text-text-secondary">{period.status}</span></summary><form action={savePeriod.bind(null, period.id)} className="mt-3 grid gap-3"><Input name="name" defaultValue={period.name} required aria-label="Nama periode" /><Input name="cabinetName" defaultValue={period.cabinetName ?? ''} aria-label="Nama kabinet" /><Input name="chairmanName" defaultValue={period.chairmanName ?? ''} aria-label="Ketua" /><div className="grid grid-cols-2 gap-3"><Input name="startDate" type="date" defaultValue={formatDateInput(period.startDate)} aria-label="Tanggal mulai" /><Input name="endDate" type="date" defaultValue={formatDateInput(period.endDate)} aria-label="Tanggal akhir" /></div><select name="status" defaultValue={period.status} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-primary" aria-label="Status periode"><option value="DRAFT">Draft</option><option value="ACTIVE">Aktif</option><option value="ARCHIVED">Arsip</option></select><Button type="submit" variant="secondary" disabled={isSaving}>Perbarui periode</Button></form></details>)}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Unit organisasi</CardTitle></CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {units.map((unit) => <details key={unit.id} className="rounded-2xl border border-border bg-surface p-4"><summary className="cursor-pointer font-heading font-bold text-primary">{unit.name} <span className="ml-2 text-xs font-medium text-text-secondary">{unit.code} · {unit.status}</span></summary><p className="mt-2 text-xs text-text-secondary">{unit._count.users} pengurus · {unit._count.programs} program · {unit._count.agendas} agenda</p><form action={saveUnit.bind(null, unit.id)} className="mt-4 grid gap-3"><UnitFields unit={unit} periods={periods} members={members} disabled={isSaving} /><Button type="submit" variant="secondary" disabled={isSaving}>Simpan unit</Button></form><p className="mt-4 text-xs text-text-secondary">Jabatan: {unit.positions.map((position) => position.name).join(', ') || 'Belum ada'}</p></details>)}
          <details className="rounded-2xl border border-dashed border-border bg-surface-alt p-4"><summary className="cursor-pointer font-semibold text-primary">Tambah unit organisasi</summary><form action={createUnit} className="mt-4 grid gap-3"><UnitFields periods={periods} members={members} disabled={isSaving} /><Button type="submit" disabled={isSaving}><Plus className="mr-2 h-4 w-4" />Tambah unit</Button></form></details>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UserRoundCog className="h-5 w-5" />Tambah jabatan</CardTitle></CardHeader>
        <CardContent><form action={createPosition} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"><Input name="name" required placeholder="Contoh: Koordinator Publikasi" disabled={isSaving} aria-label="Nama jabatan" /><select name="departmentId" className="h-11 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-primary" aria-label="Unit organisasi"><option value="">BPH / lintas unit</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select><Button type="submit" disabled={isSaving}>Tambah jabatan</Button></form></CardContent>
      </Card>
    </div>
  )
}

function readUnitInput(formData: FormData) {
  return {
    name: formValue(formData, 'name'), code: formValue(formData, 'code'), description: formValue(formData, 'description'), email: formValue(formData, 'email'),
    headMemberId: formValue(formData, 'headMemberId'), periodId: formValue(formData, 'periodId'), status: formValue(formData, 'status') as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
    unitType: formValue(formData, 'unitType') as 'BPH' | 'SECRETARIAT' | 'TREASURY' | 'DEPARTMENT' | 'DIVISION',
  }
}

function UnitFields({ unit, periods, members, disabled }: { unit?: Unit; periods: Period[]; members: Member[]; disabled: boolean }) {
  return <><Input name="name" required defaultValue={unit?.name} placeholder="Nama unit" disabled={disabled} aria-label="Nama unit" /><Input name="code" required defaultValue={unit?.code} placeholder="Kode unit" disabled={disabled} aria-label="Kode unit" /><Input name="email" type="email" defaultValue={unit?.email ?? ''} placeholder="Email unit" disabled={disabled} aria-label="Email unit" /><Textarea name="description" defaultValue={unit?.description ?? ''} placeholder="Deskripsi singkat" rows={3} disabled={disabled} aria-label="Deskripsi unit" /><div className="grid gap-3 sm:grid-cols-2"><select name="periodId" defaultValue={unit?.periodId ?? ''} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-primary" aria-label="Periode"><option value="">Tanpa periode</option>{periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}</select><select name="headMemberId" defaultValue={unit?.headMemberId ?? ''} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-primary" aria-label="Penanggung jawab"><option value="">Belum ditentukan</option>{members.map((member) => <option key={member.id} value={member.id}>{member.fullName} ({member.membershipStatus})</option>)}</select></div><div className="grid gap-3 sm:grid-cols-2"><select name="unitType" defaultValue={unit?.unitType ?? 'DEPARTMENT'} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-primary" aria-label="Jenis unit"><option value="BPH">BPH</option><option value="SECRETARIAT">Sekretariat</option><option value="TREASURY">Bendahara</option><option value="DEPARTMENT">Departemen</option><option value="DIVISION">Divisi</option></select><select name="status" defaultValue={unit?.status ?? 'ACTIVE'} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-primary" aria-label="Status unit"><option value="ACTIVE">Aktif</option><option value="INACTIVE">Tidak aktif</option><option value="ARCHIVED">Arsip</option></select></div></>
}
