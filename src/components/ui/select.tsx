'use client'

import { cn } from '@/lib/utils'

type SelectProps = {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

export function Select({ value, onValueChange, children, className }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => onValueChange?.(event.target.value)}
      className={cn('h-11 w-full rounded-xl bg-surface px-4 text-sm ring-1 ring-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', className)}
    >
      {children}
    </select>
  )
}

export function SelectTrigger({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

export function SelectValue() {
  return null
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>
}
