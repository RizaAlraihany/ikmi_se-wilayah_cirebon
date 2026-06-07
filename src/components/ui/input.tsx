import { cn } from '@/lib/utils'

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-xl bg-surface px-4 text-sm text-primary ring-1 ring-line transition placeholder:text-muted focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-11 w-full rounded-xl bg-surface px-4 text-sm text-primary ring-1 ring-line transition focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}
