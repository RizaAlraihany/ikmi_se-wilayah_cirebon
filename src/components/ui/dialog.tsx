'use client'

import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { cn } from '@/lib/utils'

export type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  closeLabel?: string
  containerClassName?: string
  contentClassName?: string
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  closeLabel = 'Tutup dialog',
  containerClassName,
  contentClassName,
}: DialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    contentRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onOpenChange(false)
        return
      }

      if (event.key !== 'Tab' || !contentRef.current) return
      const focusable = Array.from(
        contentRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
      const first = focusable[0]
      const last = focusable.at(-1)

      if (!first || !last) {
        event.preventDefault()
        return
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [onOpenChange, open])

  if (!open) return null

  return (
    <div
      className={cn('fixed inset-0 z-[var(--z-dialog)] flex items-stretch justify-center bg-primary/55 p-0 sm:items-center sm:p-4', containerClassName)}
      role="presentation"
      onMouseDown={() => onOpenChange(false)}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn('ikmi-glass-surface h-dvh max-h-dvh w-full max-w-none overflow-y-auto rounded-none p-5 outline-none sm:h-auto sm:max-h-[calc(100svh-2rem)] sm:max-w-lg sm:rounded-lg sm:p-6', contentClassName)}
        data-glass="floating"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-heading text-xl font-extrabold text-primary">
              {title}
            </h2>
            {description ? <p id={descriptionId} className="mt-1 text-sm leading-6 text-text-secondary">{description}</p> : null}
          </div>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => onOpenChange(false)}
            className="ikmi-button ikmi-button--ghost flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-text-secondary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}
