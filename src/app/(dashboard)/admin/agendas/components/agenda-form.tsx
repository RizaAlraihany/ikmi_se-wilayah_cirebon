'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Save } from 'lucide-react'
import { createAgendaAction, updateAgendaAction } from '@/features/agendas/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Unit = { id: string; name: string }
type Period = { id: string; name: string; status: string }
type Member = { id: string; fullName: string; membershipStatus: string }
type Program = { id: string; name: string; actualEnd: Date | null }
type ScheduleType = 'FIXED_DATE' | 'RECURRING' | 'CONDITIONAL' | 'RELATIVE_TO_PROGRAM' | 'DEPENDENT_ON_PROGRAM'
type Agenda = {
  id: string
  name: string
  organizationalUnitId: string | null
  periodId: string | null
  description: string | null
  picId: string | null
  programId: string | null
  scheduleType: ScheduleType
  startDatetime: string
  endDatetime: string
  recurrenceRule: string | null
  relativeToProgramId: string | null
  relativeOffset: number | null
  conditionalNote: string | null
  location: string | null
  visibility: string
  status: string
  requiresRegistration: boolean | null
  registrationType: string | null
}

const scheduleLabels: Record<ScheduleType, string> = {
  FIXED_DATE: 'Tanggal tetap',
  RECURRING: 'Berulang',
  CONDITIONAL: 'Kondisional',
  RELATIVE_TO_PROGRAM: 'Relatif ke Program',
  DEPENDENT_ON_PROGRAM: 'Mengikuti Program',
}

const supportedScheduleTypes: ScheduleType[] = ['FIXED_DATE', 'CONDITIONAL']

const periodLabels: Record<string, string> = { ACTIVE: 'Aktif', DRAFT: 'Draft', ARCHIVED: 'Arsip' }

function editableStatus(status: string | undefined) {
  if (status === 'DRAFT' || status === 'POSTPONED' || status === 'CANCELLED') return status
  return 'SCHEDULED'
}

export function AgendaForm({
  units,
  periods,
  members,
  programs,
  agenda,
}: {
  units: Unit[]
  periods: Period[]
  members: Member[]
  programs: Program[]
  agenda?: Agenda
}) {
  const router = useRouter()
  const [scheduleType, setScheduleType] = useState<ScheduleType>(agenda?.scheduleType ?? 'FIXED_DATE')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const missingMasterData = units.length === 0 || periods.length === 0
  const disabled = saving || missingMasterData
  const isLegacySchedule = Boolean(agenda && !supportedScheduleTypes.includes(agenda.scheduleType))
  const hasLegacyRegistration = Boolean(agenda?.requiresRegistration)

  async function submit(formData: FormData) {
    setSaving(true)
    setMessage('')
    const schedule = isLegacySchedule && agenda
      ? {
          scheduleType: agenda.scheduleType,
          startDatetime: agenda.startDatetime,
          endDatetime: agenda.endDatetime,
          recurrenceRule: agenda.recurrenceRule,
          relativeToProgramId: agenda.relativeToProgramId,
          relativeOffset: agenda.relativeOffset,
          conditionalNote: agenda.conditionalNote,
        }
      : {
          scheduleType,
          startDatetime: get(formData, 'startDatetime'),
          endDatetime: get(formData, 'endDatetime'),
          recurrenceRule: get(formData, 'recurrenceRule'),
          relativeToProgramId: get(formData, 'relativeToProgramId'),
          relativeOffset: get(formData, 'relativeOffset'),
          conditionalNote: get(formData, 'conditionalNote'),
        }
    const payload = {
      name: get(formData, 'name'),
      organizationalUnitId: get(formData, 'organizationalUnitId'),
      periodId: get(formData, 'periodId'),
      description: get(formData, 'description'),
      picId: get(formData, 'picId'),
      programId: get(formData, 'programId'),
      ...schedule,
      location: get(formData, 'location'),
      visibility: get(formData, 'visibility'),
      status: get(formData, 'status'),
      requiresRegistration: hasLegacyRegistration,
      registrationType: hasLegacyRegistration ? agenda?.registrationType ?? null : null,
    }
    const result = agenda ? await updateAgendaAction(agenda.id, payload) : await createAgendaAction(payload)
    setSaving(false)
    if (!result.success || !result.data) {
      setMessage(result.error ?? 'Agenda belum dapat disimpan.')
      return
    }
    router.push(`/admin/agendas/${result.data.id}`)
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <header className="border-y border-border bg-surface px-1 py-6 sm:px-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Pengelolaan Agenda</p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold text-primary">{agenda ? 'Edit Agenda' : 'Buat Agenda'}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
          Waktu normal dihitung otomatis. Gunakan status manual hanya untuk draft, penundaan, atau pembatalan.
        </p>
      </header>

      {missingMasterData ? (
        <p role="alert" className="flex gap-2 border-l-2 border-warning bg-warning-surface p-4 text-sm font-semibold text-warning-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Unit aktif atau periode belum tersedia. Lengkapi data organisasi sebelum menyimpan Agenda.
        </p>
      ) : null}
      {message ? (
        <p role="alert" className="flex gap-2 border-l-2 border-danger bg-danger/10 p-4 text-sm font-semibold text-primary">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {message}
        </p>
      ) : null}

      <form action={submit} className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Data Agenda</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Nama Agenda"><Input name="name" defaultValue={agenda?.name} required maxLength={160} disabled={disabled} /></Field>
            <Field label="Unit organisasi">
              <Select name="organizationalUnitId" defaultValue={agenda?.organizationalUnitId ?? units[0]?.id ?? ''} disabled={disabled}>
                {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
              </Select>
            </Field>
            <Field label="Periode">
              <Select name="periodId" defaultValue={agenda?.periodId ?? periods.find((period) => period.status === 'ACTIVE')?.id ?? periods[0]?.id ?? ''} disabled={disabled}>
                {periods.map((period) => <option key={period.id} value={period.id}>{period.name} ({periodLabels[period.status] ?? period.status})</option>)}
              </Select>
            </Field>
            <Field label="PIC">
              <Select name="picId" defaultValue={agenda?.picId ?? ''} disabled={disabled}>
                <option value="">Belum ditentukan</option>
                {members.map((member) => <option key={member.id} value={member.id}>{member.fullName} ({member.membershipStatus})</option>)}
              </Select>
            </Field>
            <Field label="Program terkait">
              <Select name="programId" defaultValue={agenda?.programId ?? ''} disabled={disabled}>
                <option value="">Tidak terhubung Program</option>
                {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
              </Select>
            </Field>
            <Field label="Lokasi"><Input name="location" defaultValue={agenda?.location ?? ''} maxLength={200} disabled={disabled} placeholder="Opsional" /></Field>
            <div className="md:col-span-2"><Field label="Deskripsi"><Textarea name="description" defaultValue={agenda?.description ?? ''} maxLength={10_000} disabled={disabled} rows={4} placeholder="Opsional" /></Field></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Jadwal Agenda</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isLegacySchedule ? (
              <div className="border-l-2 border-warning bg-warning-surface px-4 py-3 text-sm leading-6 text-warning-foreground">
                <p className="font-semibold">Jadwal lama: {scheduleLabels[scheduleType]}</p>
                <p className="mt-1">Aturan berulang dan agenda berbasis Program telah dibekukan sesuai PRD v5. Data jadwal ini tetap dipertahankan; Anda masih dapat memperbarui informasi umum atau mengarsipkannya.</p>
              </div>
            ) : (
              <>
                <Field label="Tipe jadwal">
                  <Select value={scheduleType} onChange={(event) => setScheduleType(event.target.value as ScheduleType)} disabled={disabled}>
                    {supportedScheduleTypes.map((value) => <option key={value} value={value}>{scheduleLabels[value]}</option>)}
                  </Select>
                </Field>
                {scheduleType === 'FIXED_DATE' ? <DateFields agenda={agenda} disabled={disabled} required /> : null}
                {scheduleType === 'CONDITIONAL' ? (
              <Field label="Kondisi jadwal">
                <Textarea name="conditionalNote" defaultValue={agenda?.conditionalNote ?? ''} maxLength={5_000} disabled={disabled} required rows={3} placeholder="Contoh: Dilaksanakan setelah kebutuhan unit disetujui." />
                <p className="mt-2 text-xs text-text-secondary">Agenda tetap tersimpan tanpa tanggal sampai kondisi memiliki jadwal konkret.</p>
              </Field>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Publikasi</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Visibilitas">
              <Select name="visibility" defaultValue={agenda?.visibility ?? 'HIDDEN'} disabled={disabled}>
                <option value="HIDDEN">Disembunyikan</option>
                <option value="PENGURUS_ONLY">Khusus pengurus</option>
                <option value="BPH_ONLY">Khusus BPH</option>
                <option value="MEMBER_ONLY">Khusus anggota</option>
                <option value="PUBLIC">Publik</option>
              </Select>
            </Field>
            <Field label="Status publikasi">
              <Select name="status" defaultValue={editableStatus(agenda?.status)} disabled={disabled}>
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Aktif — status waktu otomatis</option>
                <option value="POSTPONED">Ditunda</option>
                <option value="CANCELLED">Dibatalkan</option>
              </Select>
            </Field>
            {hasLegacyRegistration ? (
              <div className="border-l-2 border-warning bg-warning-surface px-4 py-3 text-sm leading-6 text-warning-foreground md:col-span-2">
                Pendaftaran Agenda lama tetap dipertahankan sebagai riwayat. Pendaftaran anggota IKMI dikelola dari menu Anggota.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={disabled} className="w-full sm:w-auto">
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Menyimpan…' : 'Simpan Agenda'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function DateFields({ agenda, disabled, required = false }: { agenda?: Agenda; disabled: boolean; required?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Mulai"><Input name="startDatetime" type="datetime-local" defaultValue={agenda?.startDatetime ?? ''} required={required} disabled={disabled} /></Field>
      <Field label="Selesai"><Input name="endDatetime" type="datetime-local" defaultValue={agenda?.endDatetime ?? ''} disabled={disabled} /></Field>
    </div>
  )
}

function get(formData: FormData, key: string) {
  return String(formData.get(key) ?? '')
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2 text-sm font-semibold text-primary"><span>{label}</span>{children}</label>
}
