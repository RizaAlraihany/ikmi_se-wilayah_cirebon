'use client'

import { useState } from 'react'
import { CalendarRange, CheckCircle2, History, PlusCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { startNewPeriodAction } from '@/features/organization/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

type ActivePeriod = { id: string; name: string; cabinetName: string | null; startDate: Date | null; endDate: Date | null; status: string }
type Setup = { cabinetReady: boolean; visionMissionReady: boolean; structureCount: number; programCount: number; scheduledProgramCount: number; agendaCount: number; bannerCount: number }

export function PeriodSettings({ activePeriod, history, setup }: { activePeriod: ActivePeriod | null; history: { id: string; name: string; status: string; startDate: Date | null; endDate: Date | null }[]; setup: Setup | null }) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function startPeriod(formData: FormData) {
    setSaving(true)
    setMessage('')
    const result = await startNewPeriodAction({
      name: String(formData.get('name') ?? ''),
      startDate: String(formData.get('startDate') ?? ''),
      endDate: String(formData.get('endDate') ?? ''),
    })
    setSaving(false)
    if (result.error) {
      setMessage(result.error)
      return
    }
    setDialogOpen(false)
    setMessage(`Periode ${result.data.name} sudah aktif. Ruang kerja periode baru dimulai dalam keadaan kosong.`)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <header className="border-y-2 border-primary bg-surface px-1 py-6 sm:px-5">
        <p className="text-xs font-bold uppercase text-accent">Organisasi</p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold text-balance text-primary">Pengaturan Periode</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-pretty text-text-secondary">Mulai periode kepengurusan baru dari satu tempat. Data periode sebelumnya tetap tersimpan sebagai histori.</p>
      </header>

      {message ? <p role="status" className="border-l-2 border-accent bg-surface-alt px-4 py-3 text-sm font-semibold text-primary">{message}</p> : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CalendarRange className="size-5" aria-hidden="true" />Periode aktif</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {activePeriod ? (
              <div className="border-l-2 border-primary pl-4">
                <p className="font-heading text-2xl font-extrabold text-balance text-primary">{activePeriod.name}</p>
                <p className="mt-1 text-sm text-text-secondary">Kabinet: {activePeriod.cabinetName || 'Belum diisi'}</p>
                <p className="mt-1 text-xs font-bold uppercase text-accent">{activePeriod.status}</p>
              </div>
            ) : <p className="text-sm leading-6 text-text-secondary">Belum ada periode aktif. Mulai periode pertama untuk membuka workspace organisasi.</p>}
            <Button onClick={() => setDialogOpen(true)}><PlusCircle className="size-4" aria-hidden="true" />Mulai Periode Baru</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Aturan pergantian</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-text-secondary">
            <p>Periode aktif saat ini akan diarsipkan.</p>
            <p>Agenda, Kegiatan, Struktur, kabinet, dan banner periode baru dimulai kosong.</p>
            <p>Anggota, publikasi, kontak, dan semua histori tidak dihapus.</p>
          </CardContent>
        </Card>
      </section>

      {setup && activePeriod ? <SetupCard periodName={activePeriod.name} setup={setup} /> : null}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><History className="size-5" aria-hidden="true" />Histori periode</CardTitle></CardHeader>
        <CardContent>
          {history.length ? <ul className="divide-y divide-border border-y border-border"><>{history.map((period) => <li key={period.id} className="flex min-h-14 items-center justify-between gap-4 px-1 py-3"><span className="font-semibold text-primary">{period.name}</span><span className="text-xs font-bold uppercase text-text-secondary">{period.status}</span></li>)}</></ul> : <p className="text-sm text-text-secondary">Belum ada histori periode.</p>}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="Mulai periode baru" description="Tindakan ini mengarsipkan periode aktif dan tidak dapat dibatalkan dari halaman ini.">
        <form action={startPeriod} className="space-y-4">
          <p className="rounded-md border border-border bg-surface-alt p-3 text-sm leading-6 text-text-secondary">Data periode sebelumnya tetap tersimpan. Workspace periode baru belum memiliki agenda, kegiatan, struktur, kabinet, atau banner.</p>
          <Input name="name" required placeholder="Contoh: Kepengurusan 2027–2028" disabled={saving} aria-label="Nama periode baru" />
          <div className="grid grid-cols-2 gap-3"><Input name="startDate" type="date" disabled={saving} aria-label="Tanggal mulai" /><Input name="endDate" type="date" disabled={saving} aria-label="Tanggal akhir" /></div>
          <div className="flex flex-wrap justify-end gap-3"><Button type="button" variant="secondary" disabled={saving} onClick={() => setDialogOpen(false)}>Batal</Button><Button type="submit" disabled={saving}>{saving ? 'Memulai…' : 'Mulai Periode Baru'}</Button></div>
        </form>
      </Dialog>
    </div>
  )
}

function SetupCard({ periodName, setup }: { periodName: string; setup: Setup }) {
  const rows = [
    ['Kabinet', setup.cabinetReady ? 'Lengkap' : 'Belum', setup.cabinetReady],
    ['Visi & Misi', setup.visionMissionReady ? 'Lengkap' : 'Belum', setup.visionMissionReady],
    ['Struktur Pengurus', `${setup.structureCount} orang`, setup.structureCount > 0],
    ['Kegiatan', `${setup.programCount}`, setup.programCount > 0],
    ['Sudah Dijadwalkan', `${setup.scheduledProgramCount} / ${setup.programCount}`, setup.scheduledProgramCount === setup.programCount && setup.programCount > 0],
    ['Agenda', `${setup.agendaCount}`, setup.agendaCount > 0],
    ['Banner Kegiatan', `${setup.bannerCount}`, setup.bannerCount > 0],
  ] as const
  return <Card><CardHeader><CardTitle>Setup Periode {periodName}</CardTitle></CardHeader><CardContent><dl className="divide-y divide-border border-y border-border">{rows.map(([label, value, complete]) => <div key={label} className="flex min-h-12 items-center justify-between gap-4 px-1 py-3"><dt className="text-sm font-medium text-text-secondary">{label}</dt><dd className="flex items-center gap-2 text-sm font-bold tabular-nums text-primary">{complete ? <CheckCircle2 className="size-4 text-success" aria-label="Lengkap" /> : null}{value}</dd></div>)}</dl></CardContent></Card>
}
