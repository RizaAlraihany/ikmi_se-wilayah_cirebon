'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Member {
  id: string
  nama: string
  jabatan: string
  kampus: string
  initials: string
}

interface KabinetSliderProps {
  kabinet: Member[]
}

function KabinetCard({ member }: { member: Member }) {
  return (
    <Card className="h-full transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
      <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
        {/* Avatar placeholder */}
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xl font-extrabold text-surface ring-4 ring-background-warm"
          aria-hidden="true"
        >
          {member.initials}
        </div>
        <div className="space-y-1">
          <p className="font-heading text-base font-bold text-primary">
            {member.nama}
          </p>
          <p className="text-xs font-semibold text-accent">{member.jabatan}</p>
          <p className="text-xs text-muted">{member.kampus}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function KabinetSlider({ kabinet }: KabinetSliderProps) {
  const [sliderIndex, setSliderIndex] = useState(0)

  if (!kabinet || kabinet.length === 0) {
    return <p className="text-muted text-sm italic">Belum ada data pengurus.</p>
  }

  const visibleKabinet = kabinet.slice(sliderIndex, sliderIndex + 3)
  const canPrev = sliderIndex > 0
  const canNext = sliderIndex + 3 < kabinet.length

  return (
    <div className="relative">
      {/* Desktop slider controls */}
      <div className="hidden items-center justify-end gap-2 md:flex mb-4">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setSliderIndex((i) => Math.max(0, i - 1))}
          disabled={!canPrev}
          aria-label="Slider sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() =>
            setSliderIndex((i) => Math.min(kabinet.length - 3, i + 1))
          }
          disabled={!canNext}
          aria-label="Slider berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Desktop: 3 visible cards */}
      <div
        className="hidden gap-4 md:grid md:grid-cols-3"
        aria-label="Kartu pengurus kabinet"
      >
        {visibleKabinet.map((member) => (
          <KabinetCard key={member.id} member={member} />
        ))}
      </div>

      {/* Mobile: horizontal swipe */}
      <div
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:hidden"
        aria-label="Kartu pengurus kabinet"
      >
        {kabinet.map((member) => (
          <div
            key={member.id}
            className="min-w-[270px] flex-shrink-0 snap-start"
          >
            <KabinetCard member={member} />
          </div>
        ))}
      </div>
    </div>
  )
}
