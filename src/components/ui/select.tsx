'use client'

import { cn } from '@/lib/utils'

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

export function Select({ value, onValueChange, children, className, onChange, style, ...props }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => {
        onChange?.(event)
        onValueChange?.(event.target.value)
      }}
      className={cn(
        'h-11 w-full cursor-pointer appearance-none rounded-xl border border-border bg-surface px-4 pr-11 text-sm font-semibold text-primary shadow-sm transition hover:border-accent/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-surface-alt disabled:opacity-70',
        className,
      )}
      style={{
        backgroundImage:
          'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23001769\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.8\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")',
        backgroundPosition: 'right 0.875rem center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '1rem',
        ...style,
      }}
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
