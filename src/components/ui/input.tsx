import { cn } from '@/lib/utils'

const controlClassName =
  'w-full rounded-xl border border-border bg-surface text-sm text-primary shadow-sm transition placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-surface-alt disabled:opacity-70'

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        controlClassName,
        'h-11 px-4',
        'file:mr-4 file:h-9 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:text-sm file:font-semibold file:text-surface hover:file:bg-secondary',
        props.type === 'file' ? 'cursor-pointer py-1.5 pl-2 text-text-secondary file:cursor-pointer' : '',
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
        controlClassName,
        'h-11 cursor-pointer px-4',
        className,
      )}
      {...props}
    />
  )
}
