'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type ListboxOption = {
  value: string
  label: string
  disabled?: boolean
}

type ListboxSelectProps = {
  id?: string
  value?: string
  defaultValue?: string
  options: ListboxOption[]
  onValueChange?: (value: string) => void
  name?: string
  disabled?: boolean
  'aria-label'?: string
  className?: string
  triggerClassName?: string
  menuClassName?: string
}

export function ListboxSelect({
  id,
  value,
  defaultValue,
  options,
  onValueChange,
  name,
  disabled = false,
  'aria-label': ariaLabel,
  className,
  triggerClassName,
  menuClassName,
}: ListboxSelectProps) {
  const generatedId = useId()
  const controlId = id ?? generatedId
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value ?? '')

  const resolvedValue = value ?? internalValue
  const selectedOption = options.find((option) => option.value === resolvedValue) ?? options[0]

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function selectOption(nextValue: string) {
    if (value === undefined) {
      setInternalValue(nextValue)
    }
    onValueChange?.(nextValue)
    setIsOpen(false)
  }

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      {name ? <input type="hidden" name={name} value={resolvedValue} /> : null}
      <button
        type="button"
        id={controlId}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${controlId}-listbox`}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 text-left text-sm font-semibold text-primary shadow-sm transition',
          'hover:border-accent/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20',
          'disabled:cursor-not-allowed disabled:bg-surface-alt disabled:opacity-70',
          triggerClassName,
        )}
      >
        <span className="truncate">{selectedOption?.label ?? 'Pilih opsi'}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-primary transition', isOpen && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {isOpen && !disabled ? (
        <div
          id={`${controlId}-listbox`}
          role="listbox"
          className={cn(
            'absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-border bg-surface p-1 shadow-float',
            menuClassName,
          )}
        >
          {options.map((option) => {
            const selected = option.value === resolvedValue
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={option.disabled}
                onClick={() => selectOption(option.value)}
                className={cn(
                  'flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm font-semibold transition',
                  selected
                    ? 'bg-primary text-surface'
                    : 'text-primary hover:bg-surface-alt',
                  option.disabled && 'cursor-not-allowed opacity-50',
                )}
              >
                <span>{option.label}</span>
                {selected ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
