'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Member {
  id: string
  nama: string
  jabatan: string
  kampus: string
  initials: string
  photoUrl?: string | null
}

interface KabinetSliderProps {
  kabinet: Member[]
}

// =========================================
// Kabinet Card — tampilan portrait per card
// =========================================
function KabinetCard({
  member,
}: {
  member: Member
}) {
  return (
    <div className="isolate flex h-full flex-col overflow-hidden rounded-[inherit] bg-white shadow-none [backface-visibility:hidden]">
      {/* Foto area (avatar placeholder dengan aspect 3:4) */}
      <div className="relative w-full overflow-hidden bg-surface-alt" style={{ aspectRatio: '4/5' }}>

        {member.photoUrl ? (
          <Image
            src={member.photoUrl}
            alt={member.nama}
            width={300}
            height={400}
            className="h-full w-full object-cover object-top"
            unoptimized
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-muted text-4xl font-extrabold text-surface relative overflow-hidden"
            aria-hidden="true"
          >
            <Image
              src="/images/avatar-placeholder.png"
              alt="Placeholder"
              fill
              className="object-cover object-center opacity-50"
              unoptimized
            />
          </div>
        )}
      </div>

      {/* Info teks di bawah foto */}
      <div className="px-3 pb-3 pt-2 md:px-4 md:pb-4">
        <p
          className="mb-1 text-[8px] font-bold uppercase tracking-[0.1em] md:text-[9px]"
          style={{ color: 'var(--accent)' }}
        >
          IKMI Cirebon
        </p>
        <p
          className="font-heading text-sm font-bold leading-snug md:text-base"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
        >
          {member.nama}
        </p>
        <p
          className="mt-1 text-[9px] font-bold uppercase tracking-[0.06em] md:text-[10px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {member.jabatan}
        </p>

      </div>
    </div>
  )
}

// =========================================
// Main Slider
// =========================================
export function KabinetSlider({ kabinet }: KabinetSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const mobileTrackRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Array<HTMLDivElement | null>>([])
  const total = kabinet?.length ?? 0

  // Hooks harus dipanggil SEBELUM early return (Rules of Hooks)
  const goTo = useCallback(
    (index: number, options?: { scrollCard?: boolean }) => {
      if (total === 0) return
      const next = (index + total) % total
      setActiveIndex(next)
      if (options?.scrollCard) {
        // Mobile: center the card only for direct user navigation.
        cardRefs.current[next]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        })
      }
    },
    [total]
  )

  // Keyboard navigation untuk desktop
  useEffect(() => {
    if (total === 0) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goTo(activeIndex - 1)
      if (e.key === 'ArrowRight') goTo(activeIndex + 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [activeIndex, goTo, total])

  useEffect(() => {
    if (total <= 1) return

    const timer = window.setInterval(() => {
      goTo(activeIndex + 1)
    }, 4500)

    return () => window.clearInterval(timer)
  }, [activeIndex, goTo, total])

  if (!kabinet || kabinet.length === 0) {
    return (
      <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>
        Belum ada data pengurus.
      </p>
    )
  }

  /**
   * Menghitung posisi relatif card terhadap active index.
   * Gunakan jalur terpendek memutar agar wraparound halus.
   */
  const getPos = (index: number): number => {
    let pos = index - activeIndex
    if (pos > total / 2) pos -= total
    if (pos < -total / 2) pos += total
    return pos
  }

  /**
   * CSS transform & style per posisi (pos -2 hingga +2).
   * Pos di luar ±2 → disembunyikan.
   */
  const getCardStyle = (pos: number): React.CSSProperties => {
    const abs = Math.abs(pos)
    if (abs > 3) {
      return { opacity: 0, pointerEvents: 'none', zIndex: 0 }
    }

    const configs: Record<
      number,
      { scale: number; translateX: number; opacity: number; blur: boolean; zIndex: number }
    > = {
      0:  { scale: 1,    translateX: 0,    opacity: 1,    blur: false, zIndex: 5 },
      1:  { scale: 0.88, translateX: 190,  opacity: 0.85, blur: false, zIndex: 4 },
      [-1]: { scale: 0.88, translateX: -190, opacity: 0.85, blur: false, zIndex: 4 },
      2:  { scale: 0.76, translateX: 335,  opacity: 0.5,  blur: true,  zIndex: 3 },
      [-2]: { scale: 0.76, translateX: -335, opacity: 0.5,  blur: true,  zIndex: 3 },
      3:  { scale: 0.66, translateX: 465,  opacity: 0.25, blur: true,  zIndex: 2 },
      [-3]: { scale: 0.66, translateX: -465, opacity: 0.25, blur: true, zIndex: 2 },
    }

    const cfg = configs[pos] ?? configs[abs > 0 ? (pos > 0 ? 3 : -3) : 0]
    return {
      transform: `translate(-50%, -50%) scale(${cfg.scale}) translateX(${cfg.translateX}px)`,
      opacity: cfg.opacity,
      filter: cfg.blur ? 'blur(1px)' : 'none',
      zIndex: cfg.zIndex,
      boxShadow:
        abs === 0
          ? '0 20px 50px rgba(0,23,105,0.18)'
          : abs === 1
            ? '0 10px 26px rgba(0,23,105,0.10)'
            : '0 6px 16px rgba(0,23,105,0.07)',
    }
  }

  return (
    <div>
      {/* ====== DESKTOP: 5-layer center-focus (≥1024px) ====== */}
      <div
        className="relative hidden overflow-hidden md:block"
        style={{ height: '400px' }}
        aria-label="Slider pengurus kabinet"
      >
        {kabinet.map((member, index) => {
          const pos = getPos(index)
          const abs = Math.abs(pos)
          const isActive = pos === 0
          const isHidden = abs > 3
          const isClickable = abs > 0 && abs <= 3

          return (
            <button
              key={member.id}
              type="button"
              className="overflow-hidden rounded-2xl bg-white p-0"
              onClick={isClickable ? () => goTo(index, { scrollCard: true }) : undefined}
              disabled={isHidden}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: abs === 0 ? '230px' : abs === 1 ? '205px' : '185px',
                borderRadius: '1rem',
                cursor: isActive ? 'default' : isClickable ? 'pointer' : 'default',
                pointerEvents: isHidden ? 'none' : 'auto',
                transition:
                  'transform 450ms cubic-bezier(0.25,0.46,0.45,0.94), opacity 450ms ease, filter 450ms ease, box-shadow 450ms ease',
                willChange: 'transform, opacity',
                ...getCardStyle(pos),
              }}
              aria-label={isActive ? `Pengurus aktif: ${member.nama}` : `Pilih pengurus ${member.nama}`}
              aria-current={isActive ? 'true' : undefined}
            >
              <KabinetCard member={member} />
            </button>
          )
        })}
      </div>

      {/* Dots indicator desktop */}
      <div
        className="mt-3 hidden items-center justify-center gap-4 md:flex"
        aria-label="Posisi slider"
      >
        <button
          type="button"
          onClick={() => goTo(activeIndex - 1, { scrollCard: true })}
          aria-label="Pengurus sebelumnya"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-primary shadow-sm transition hover:bg-surface-alt"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex min-w-[210px] items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${((activeIndex + 1) / total) * 100}%` }}
            />
          </div>
          <span className="min-w-12 text-right text-xs font-bold text-text-secondary">
            {activeIndex + 1}/{total}
          </span>
        </div>
        <button
          type="button"
          onClick={() => goTo(activeIndex + 1, { scrollCard: true })}
          aria-label="Pengurus berikutnya"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-primary shadow-sm transition hover:bg-surface-alt"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* ====== MOBILE: H-scroll + tombol (< 1024px) ====== */}
      <div className="md:hidden">
        {/* Track horizontal scroll (Full width edge-to-edge) */}
        <div
          ref={mobileTrackRef}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 md:gap-4 md:pb-4"
          aria-label="Kartu pengurus kabinet"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            .no-scrollbar::-webkit-scrollbar { display: none; }
          `}} />
          {kabinet.map((member, index) => (
            <div
              key={member.id}
              ref={(el) => { cardRefs.current[index] = el }}
              className="w-[64vw] max-w-[218px] flex-shrink-0 snap-center overflow-hidden rounded-2xl bg-white shadow-card sm:max-w-[240px]"
            >
              <KabinetCard member={member} />
            </div>
          ))}
        </div>

        {/* Controls: Prev Button, Dots, Next Button */}
        <div className="mt-1.5 flex items-center justify-between px-1 sm:px-6">
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1, { scrollCard: true })}
            disabled={activeIndex === 0}
            aria-label="Pengurus sebelumnya"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-white text-text-primary shadow-sm transition-all duration-150 hover:bg-surface-alt disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3" aria-hidden="true">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${((activeIndex + 1) / total) * 100}%` }}
              />
            </div>
            <span className="min-w-10 text-right text-[11px] font-bold text-text-secondary">
              {activeIndex + 1}/{total}
            </span>
          </div>

          <button
            type="button"
            onClick={() => goTo(activeIndex + 1, { scrollCard: true })}
            disabled={activeIndex >= kabinet.length - 1}
            aria-label="Pengurus berikutnya"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-white text-text-primary shadow-sm transition-all duration-150 hover:bg-surface-alt disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
