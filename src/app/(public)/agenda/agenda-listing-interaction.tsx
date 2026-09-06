'use client'

import { CalendarDays, Clock, MapPin, Repeat2, ArrowRight } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'

export type AgendaListingItem = {
  id: string
  name: string
  description: string | null
  location: string | null
  organizationalUnitName: string | null
  statusLabel: string
  statusTone: 'success' | 'warning' | 'danger' | 'accent' | 'surface'
  scheduleType: string
  dayLabel: string
  yearLabel: string
  dateLabel: string
  timeLabel: string
  endTimeLabel: string | null
  startDateTime: string
  endDateTime: string | null
}

export function AgendaListingInteraction({ items }: { items: AgendaListingItem[] }) {
  const [selectedAgenda, setSelectedAgenda] = useState<AgendaListingItem | null>(null)

  if (!items.length) {
    return (
      <div className="border-l-2 border-accent py-8 pl-5">
        <h2 className="font-heading text-xl font-extrabold text-primary">Belum ada Agenda publik</h2>
        <p className="mt-2 text-sm text-text-secondary">Agenda yang sudah dipublikasikan akan muncul di halaman ini.</p>
      </div>
    )
  }

  return (
    <>
      <div className="divide-y divide-border border-y border-border">
        {items.map((agenda) => (
          <article key={agenda.id} className="grid gap-5 py-7 md:grid-cols-[10rem_minmax(0,1fr)_13rem] md:gap-7 md:py-9">
            <div>
              <time dateTime={agenda.startDateTime} className="block font-heading text-xl font-extrabold text-accent">{agenda.dayLabel}</time>
              <p className="mt-1 text-xs font-semibold text-text-secondary">{agenda.yearLabel}</p>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={agenda.statusTone}>{agenda.statusLabel}</Badge>
                {agenda.scheduleType === 'RECURRING' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent"><Repeat2 className="h-3.5 w-3.5" aria-hidden="true" />Berulang</span>
                ) : null}
              </div>
              <h2 className="mt-3 break-words font-heading text-2xl font-extrabold leading-snug text-primary">{agenda.name}</h2>
              {agenda.description ? <p className="mt-3 max-w-3xl line-clamp-3 whitespace-pre-line break-words text-sm leading-7 text-text-secondary">{agenda.description}</p> : null}
              <button
                type="button"
                className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-accent underline decoration-2 underline-offset-4 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                aria-haspopup="dialog"
                aria-label={`Lihat detail agenda ${agenda.name}`}
                onClick={() => setSelectedAgenda(agenda)}
              >
                Lihat detail
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="min-w-0 space-y-2 break-words text-xs text-text-secondary md:text-right">
              <p className="inline-flex items-center gap-2 md:justify-end"><Clock className="h-4 w-4 text-accent" aria-hidden="true" />{agenda.timeLabel}{agenda.endTimeLabel ? ` – ${agenda.endTimeLabel}` : ''}</p>
              {agenda.location ? <p className="flex items-center gap-2 md:justify-end"><MapPin className="h-4 w-4 text-accent" aria-hidden="true" />{agenda.location}</p> : null}
              {agenda.organizationalUnitName ? <p className="flex items-center gap-2 md:justify-end"><CalendarDays className="h-4 w-4 text-accent" aria-hidden="true" />{agenda.organizationalUnitName}</p> : null}
            </div>
          </article>
        ))}
      </div>

      <Dialog
        open={selectedAgenda !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedAgenda(null)
        }}
        title={selectedAgenda?.name ?? 'Detail Agenda'}
        description="Detail agenda kegiatan publik IKMI Cirebon."
        contentClassName="sm:max-w-2xl"
      >
        {selectedAgenda ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={selectedAgenda.statusTone}>{selectedAgenda.statusLabel}</Badge>
              {selectedAgenda.scheduleType === 'RECURRING' ? <Badge tone="surface">Berulang</Badge> : null}
            </div>

            <dl className="grid gap-5 border-y border-border py-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">Tanggal</dt>
                <dd className="mt-1 text-sm leading-6 text-primary"><time dateTime={selectedAgenda.startDateTime}>{selectedAgenda.dateLabel}</time></dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">Waktu</dt>
                <dd className="mt-1 text-sm leading-6 text-primary">{selectedAgenda.timeLabel}{selectedAgenda.endTimeLabel ? ` – ${selectedAgenda.endTimeLabel}` : ''}</dd>
              </div>
              {selectedAgenda.location ? <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">Lokasi</dt>
                <dd className="mt-1 break-words text-sm leading-6 text-primary">{selectedAgenda.location}</dd>
              </div> : null}
              {selectedAgenda.organizationalUnitName ? <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">Unit penyelenggara</dt>
                <dd className="mt-1 break-words text-sm leading-6 text-primary">{selectedAgenda.organizationalUnitName}</dd>
              </div> : null}
            </dl>

            {selectedAgenda.description ? (
              <section aria-labelledby="agenda-description-heading">
                <h3 id="agenda-description-heading" className="font-heading text-lg font-extrabold text-primary">Tentang kegiatan</h3>
                <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-text-secondary">{selectedAgenda.description}</p>
              </section>
            ) : null}
          </div>
        ) : null}
      </Dialog>
    </>
  )
}
