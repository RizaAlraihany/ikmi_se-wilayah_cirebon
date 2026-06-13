'use client'

import Image from 'next/image'
import { useState } from 'react'
import { X } from 'lucide-react'

export type StrukturCardMember = {
  id: string
  name: string
  positionName: string
  photoUrl?: string | null
  campus?: string | null
  address?: string | null
}

export function StrukturCard({ member }: { member: StrukturCardMember }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="isolate flex h-full w-full max-w-[240px] flex-col overflow-hidden rounded-2xl bg-white text-center shadow-card ring-1 ring-border transition-all duration-300 hover:-translate-y-1 hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label={`Lihat detail ${member.name}`}
      >
        <div className="relative w-full overflow-hidden bg-surface-alt" style={{ aspectRatio: '5/6' }}>
          {member.photoUrl ? (
            <Image
              src={member.photoUrl}
              alt={member.name}
              width={320}
              height={400}
              className="h-full w-full object-cover object-top"
              unoptimized
            />
          ) : (
            <div
              className="relative flex h-full w-full items-center justify-center overflow-hidden bg-muted text-4xl font-extrabold text-surface"
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

        <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5 md:px-4 md:pb-4 md:pt-3">
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
            {member.name}
          </p>
          <p
            className="mt-1 min-h-[2.4em] text-[9px] font-bold uppercase leading-tight tracking-[0.06em] md:text-[10px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {member.positionName}
          </p>

        </div>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-primary/55 px-4 py-6 backdrop-blur-sm sm:px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`struktur-card-title-${member.id}`}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative my-auto w-full max-w-[760px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-border"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/80 text-primary shadow-md ring-1 ring-black/5 backdrop-blur-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              aria-label="Tutup detail pengurus"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="grid gap-0 md:grid-cols-[280px_1fr]">
              <div className="relative aspect-square max-h-[320px] w-full bg-surface-alt sm:aspect-[4/5] sm:max-h-[400px] md:aspect-auto md:max-h-none">
                {member.photoUrl ? (
                  <Image
                    src={member.photoUrl}
                    alt={member.name}
                    fill
                    className="object-cover object-top"
                    unoptimized
                  />
                ) : (
                  <Image
                    src="/images/avatar-placeholder.png"
                    alt="Placeholder"
                    fill
                    className="object-cover object-center opacity-50"
                    unoptimized
                  />
                )}
              </div>

              <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
                    Detail Pengurus
                  </p>
                  <h3
                    id={`struktur-card-title-${member.id}`}
                    className="mt-1 font-heading text-xl sm:text-2xl font-extrabold leading-tight text-primary"
                  >
                    {member.name}
                  </h3>
                  <p className="mt-1 text-[10px] sm:text-xs font-bold uppercase leading-relaxed tracking-[0.06em] text-text-secondary">
                    {member.positionName}
                  </p>
                </div>

                <div className="space-y-3 sm:space-y-4 rounded-xl border border-border bg-surface-alt p-4 text-xs sm:text-sm sm:p-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-text-secondary">
                      Asal Kampus
                    </p>
                    <p className="mt-1 break-words font-semibold text-primary">
                      {member.campus || '-'}
                    </p>
                  </div>
                  <div className="h-px bg-border" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-text-secondary">
                      Alamat
                    </p>
                    <p className="mt-1 break-words font-semibold leading-relaxed text-primary">
                      {member.address || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
