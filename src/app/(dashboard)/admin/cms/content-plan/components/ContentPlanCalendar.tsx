'use client'

import type { ContentPlanStatus } from '@prisma/client'
import { ChevronLeft, ChevronRight, ExternalLink, Link as LinkIcon, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import {
  contentPlanDateKey,
  contentPlanMonthRange,
  contentPlanStatusLabel,
  isContentPlanOverdue,
  normalizeContentPlanMonth,
  shiftContentPlanMonth,
} from '@/features/content-plan/domain'
import { buildCalendarGrid, jakartaCalendarDate, jakartaDateParts } from '@/features/public/calendar-domain'
import { ContentPlanForm, type ContentPlanFormData } from './ContentPlanForm'

type Plan = ContentPlanFormData & {
  author: { id: string; name: string }
  program: { id: string; name: string } | null
  agenda: { id: string; name: string } | null
}

interface Props {
  month: string
  plans: Plan[]
  authors: { id: string; name: string }[]
  programs: { id: string; name: string }[]
  agendas: { id: string; name: string }[]
}

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

function statusTone(status: ContentPlanStatus) {
  if (status === 'PUBLISHED') return 'success'
  if (status === 'READY') return 'accent'
  if (status === 'IN_PROGRESS' || status === 'SCHEDULED') return 'warning'
  if (status === 'CANCELLED') return 'danger'
  return 'surface'
}

function formatFullDate(value: Date) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeZone: 'Asia/Jakarta' }).format(value)
}

function formatTime(value: Date) {
  return `${new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Jakarta' }).format(value)} WIB`
}

function quickAddInstant(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(jakartaCalendarDate(year, month - 1, day).getTime() + 9 * 60 * 60 * 1000)
}

export function ContentPlanCalendar({ month, plans, authors, programs, agendas }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const range = contentPlanMonthRange(month)
  const today = new Date()
  const todayKey = contentPlanDateKey(today)
  const initialSelected = todayKey.startsWith(`${month}-`) ? todayKey : `${month}-01`
  const [selectedDate, setSelectedDate] = useState(initialSelected)
  const [quickAddDate, setQuickAddDate] = useState<Date | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const grid = useMemo(() => buildCalendarGrid(range.year, range.monthIndex), [range.monthIndex, range.year])
  const plansByDate = useMemo(() => {
    const grouped = new Map<string, Plan[]>()
    for (const plan of plans) {
      const key = contentPlanDateKey(plan.publishDate)
      grouped.set(key, [...(grouped.get(key) || []), plan])
    }
    return grouped
  }, [plans])
  const activeSelectedDate = selectedDate.startsWith(`${month}-`) ? selectedDate : initialSelected
  const selectedPlans = plansByDate.get(activeSelectedDate) || []
  const selectedInstant = quickAddInstant(activeSelectedDate)

  function navigateMonth(targetMonth: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', targetMonth)
    router.push(`/admin/cms/content-plan?${params.toString()}`)
  }

  function goToday() {
    const currentMonth = normalizeContentPlanMonth(undefined, today)
    setSelectedDate(todayKey)
    navigateMonth(currentMonth)
  }

  return (
    <div className="min-w-0">
      <header className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent">Kalender editorial</p>
          <h2 className="mt-1 font-heading text-xl font-extrabold text-primary">{monthNames[range.monthIndex]} {range.year}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={goToday}>Hari Ini</Button>
          <Button type="button" variant="secondary" size="icon" onClick={() => navigateMonth(shiftContentPlanMonth(month, -1))} aria-label="Bulan sebelumnya"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></Button>
          <Button type="button" variant="secondary" size="icon" onClick={() => navigateMonth(shiftContentPlanMonth(month, 1))} aria-label="Bulan berikutnya"><ChevronRight className="h-4 w-4" aria-hidden="true" /></Button>
          <Button type="button" size="sm" onClick={() => setQuickAddDate(selectedInstant)}><Plus className="h-4 w-4" aria-hidden="true" />Tambah Konten</Button>
        </div>
      </header>

      <section className="hidden md:block" aria-label={`Kalender Content Plan ${monthNames[range.monthIndex]} ${range.year}`}>
        <div className="grid grid-cols-7 border-b border-border bg-surface-alt">
          {dayNames.map((day) => <div key={day} className="py-3 text-center text-xs font-extrabold uppercase tracking-[0.08em] text-text-secondary">{day}</div>)}
        </div>
        <div className="grid grid-cols-7 bg-border gap-px">
          {grid.map((day) => {
            const key = contentPlanDateKey(day)
            const parts = jakartaDateParts(day)
            const inMonth = parts.month === range.monthIndex
            const dayPlans = plansByDate.get(key) || []
            return (
              <div key={key} className={`min-h-36 min-w-0 bg-surface p-1 xl:p-2 ${inMonth ? '' : 'bg-surface-alt/70 text-text-muted'}`}>
                <div className="flex items-center justify-between gap-0 xl:gap-1">
                  <button type="button" onClick={() => setSelectedDate(key)} aria-label={`Pilih ${formatFullDate(day)}`} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${key === todayKey || key === activeSelectedDate ? 'ikmi-liquid-blue' : 'text-text-secondary hover:bg-surface-alt'}`}>{parts.day}</button>
                  {inMonth ? <button type="button" onClick={() => { setSelectedDate(key); setQuickAddDate(quickAddInstant(key)) }} aria-label={`Tambah konten pada ${formatFullDate(day)}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-surface-alt hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><Plus className="h-4 w-4" aria-hidden="true" /></button> : null}
                </div>
                <div className="mt-1 max-h-36 space-y-1 overflow-y-auto">
                  {dayPlans.map((plan) => {
                    const overdue = isContentPlanOverdue(plan, today)
                    return <button key={plan.id} type="button" onClick={() => setSelectedPlan(plan)} className={`flex min-h-11 w-full min-w-0 items-center gap-1 rounded-md border px-2 py-1.5 text-left text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${overdue ? 'border-danger/35 bg-danger-surface text-danger-foreground' : 'border-border bg-surface-alt text-primary hover:border-accent/40'}`}><span className="min-w-0 flex-1 truncate font-semibold">{plan.title}</span>{overdue ? <span className="shrink-0 font-extrabold" aria-label="Terlambat">!</span> : null}</button>
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="p-4 md:hidden" aria-label={`Kalender ringkas ${monthNames[range.monthIndex]} ${range.year}`}>
        <div className="grid grid-cols-7 text-center">
          {dayNames.map((day) => <span key={day} className="py-2 text-[11px] font-extrabold uppercase text-text-muted">{day}</span>)}
          {grid.map((day) => {
            const key = contentPlanDateKey(day)
            const parts = jakartaDateParts(day)
            const inMonth = parts.month === range.monthIndex
            const count = plansByDate.get(key)?.length || 0
            return (
              <button key={key} type="button" disabled={!inMonth} onClick={() => setSelectedDate(key)} aria-label={`${formatFullDate(day)}, ${count} konten`} aria-pressed={activeSelectedDate === key} className={`relative flex min-h-11 min-w-11 flex-col items-center justify-center rounded-md text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${!inMonth ? 'text-text-muted/40' : activeSelectedDate === key || key === todayKey ? 'ikmi-liquid-blue' : 'text-text-secondary'}`}>
                {parts.day}
                {count ? <span className={`absolute bottom-1 h-1 w-1 rounded-full ${activeSelectedDate === key ? 'bg-white' : 'bg-accent'}`} aria-hidden="true" /> : null}
              </button>
            )
          })}
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-accent">Tanggal terpilih</p><h3 className="mt-1 font-heading text-lg font-extrabold text-primary">{formatFullDate(selectedInstant)}</h3></div>
            <Button type="button" size="icon" onClick={() => setQuickAddDate(selectedInstant)} aria-label={`Tambah konten pada ${formatFullDate(selectedInstant)}`}><Plus className="h-4 w-4" aria-hidden="true" /></Button>
          </div>

          {selectedPlans.length ? (
            <div className="mt-4 divide-y divide-border border-y border-border">
              {selectedPlans.map((plan) => {
                const overdue = isContentPlanOverdue(plan, today)
                return (
                  <article key={plan.id} className="min-w-0 py-5">
                    <button type="button" onClick={() => setSelectedPlan(plan)} className="w-full min-w-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                      <div className="flex flex-wrap items-center gap-2"><Badge tone={statusTone(plan.status)}>{contentPlanStatusLabel(plan.status)}</Badge>{overdue ? <Badge tone="danger">Terlambat</Badge> : null}<span className="text-xs font-semibold text-text-muted">{formatTime(plan.publishDate)}</span></div>
                      <h4 className="mt-2 break-words font-heading text-base font-extrabold text-primary">{plan.title}</h4>
                      <p className="mt-1 break-words text-xs text-text-secondary">{plan.contentType || 'Jenis belum dipilih'} · {plan.platform} · {plan.author.name}</p>
                      {plan.program || plan.agenda ? <p className="mt-2 break-words text-xs text-text-muted">{plan.program?.name || plan.agenda?.name}</p> : null}
                    </button>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {plan.pamfletRequestId ? <Link href={`/admin/request-pamflet/${plan.pamfletRequestId}`} className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-primary hover:text-accent"><LinkIcon className="h-4 w-4" aria-hidden="true" />Request asal</Link> : null}
                      {plan.assetUrl ? <a href={plan.assetUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-primary hover:text-accent">Aset <ExternalLink className="h-4 w-4" aria-hidden="true" /></a> : null}
                      {plan.publishedUrl ? <a href={plan.publishedUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-success">Publikasi <ExternalLink className="h-4 w-4" aria-hidden="true" /></a> : null}
                    </div>
                  </article>
                )
              })}
            </div>
          ) : <p className="mt-4 border-l-2 border-accent py-5 pl-4 text-sm leading-6 text-text-secondary">Belum ada rencana konten pada tanggal ini.</p>}
        </div>
      </section>

      <Sheet open={Boolean(quickAddDate)} onOpenChange={(open) => { if (!open) setQuickAddDate(null) }} title="Tambah Content Plan" description={quickAddDate ? `Jadwal awal ${formatFullDate(quickAddDate)}, pukul 09.00 WIB.` : undefined}>
        <ContentPlanForm authors={authors} programs={programs} agendas={agendas} defaultDate={quickAddDate || undefined} onSuccess={() => setQuickAddDate(null)} />
      </Sheet>

      <Sheet open={Boolean(selectedPlan)} onOpenChange={(open) => { if (!open) setSelectedPlan(null) }} title="Edit Content Plan" description="Perbarui jadwal, PIC, status produksi, aset, atau URL publikasi.">
        {selectedPlan ? <ContentPlanForm authors={authors} programs={programs} agendas={agendas} initialData={selectedPlan} onSuccess={() => setSelectedPlan(null)} /> : null}
      </Sheet>
    </div>
  )
}
