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
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [isOpen, setIsOpen] = useState(false)
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value ?? '')
  const [activeIndex, setActiveIndex] = useState(0)

  const resolvedValue = value ?? internalValue
  const selectedOption = options.find((option) => option.value === resolvedValue) ?? options[0]

  function firstEnabledIndex() {
    return Math.max(0, options.findIndex((option) => !option.disabled))
  }

  function lastEnabledIndex() {
    for (let index = options.length - 1; index >= 0; index -= 1) {
      if (!options[index]?.disabled) return index
    }
    return 0
  }

  function selectedEnabledIndex() {
    const selectedIndex = options.findIndex((option) => option.value === resolvedValue && !option.disabled)
    return selectedIndex >= 0 ? selectedIndex : firstEnabledIndex()
  }

  function closeAndFocusTrigger() {
    triggerRef.current?.focus()
    setIsOpen(false)
  }

  function openAt(index: number) {
    setActiveIndex(index)
    setIsOpen(true)
  }

  function moveActive(direction: 1 | -1) {
    if (!options.length) return

    let nextIndex = activeIndex
    for (let checked = 0; checked < options.length; checked += 1) {
      nextIndex = (nextIndex + direction + options.length) % options.length
      if (!options[nextIndex]?.disabled) {
        setActiveIndex(nextIndex)
        return
      }
    }
  }

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeAndFocusTrigger()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    optionRefs.current[activeIndex]?.focus()
  }, [activeIndex, isOpen])

  function selectOption(nextValue: string) {
    if (value === undefined) {
      setInternalValue(nextValue)
    }
    onValueChange?.(nextValue)
    closeAndFocusTrigger()
  }

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      {name ? <input type="hidden" name={name} value={resolvedValue} /> : null}
      <button
        ref={triggerRef}
        type="button"
        id={controlId}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${controlId}-listbox`}
        disabled={disabled}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false)
          } else {
            openAt(selectedEnabledIndex())
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            openAt(firstEnabledIndex())
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            openAt(lastEnabledIndex())
          }
        }}
        className={cn(
          'flex h-12 w-full items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 text-left text-base font-semibold text-primary shadow-sm transition lg:h-11 lg:text-sm',
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
          data-glass="floating"
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              moveActive(1)
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              moveActive(-1)
            } else if (event.key === 'Home') {
              event.preventDefault()
              setActiveIndex(firstEnabledIndex())
            } else if (event.key === 'End') {
              event.preventDefault()
              setActiveIndex(lastEnabledIndex())
            } else if (event.key === 'Escape') {
              event.preventDefault()
              event.stopPropagation()
              closeAndFocusTrigger()
            }
          }}
          className={cn(
            'ikmi-glass-surface absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-lg p-1',
            menuClassName,
          )}
        >
          {options.map((option, index) => {
            const selected = option.value === resolvedValue
            return (
              <button
                ref={(element) => {
                  optionRefs.current[index] = element
                }}
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={option.disabled}
                onClick={() => selectOption(option.value)}
                onFocus={() => setActiveIndex(index)}
                className={cn(
                  'flex min-h-12 w-full items-center justify-between gap-3 rounded-md px-3 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent lg:min-h-11',
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
