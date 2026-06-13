'use client'

import { cn } from '@/lib/utils'

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

export function Select({ value, onValueChange, children, className, onChange, ...props }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => {
        onChange?.(event)
        onValueChange?.(event.target.value)
      }}
      className={cn(
        'h-11 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 text-sm text-primary shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-surface-alt disabled:opacity-70',
        className,
      )}
      {...props}
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
