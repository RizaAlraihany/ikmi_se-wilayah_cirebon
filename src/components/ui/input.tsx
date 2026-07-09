import { cn } from '@/lib/utils'

export const inputControlClassName =
  'w-full rounded-xl border border-border bg-surface text-sm text-primary shadow-sm transition placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-surface-alt disabled:opacity-70'

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        inputControlClassName,
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
  style,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        inputControlClassName,
        'h-11 cursor-pointer appearance-none px-4 pr-11 font-semibold hover:border-accent/60',
        className,
      )}
      style={{
        backgroundImage:
          'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23001e6c\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.6\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")',
        backgroundPosition: 'right 0.875rem center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '1rem',
        ...style,
      }}
      {...props}
    />
  )
}
