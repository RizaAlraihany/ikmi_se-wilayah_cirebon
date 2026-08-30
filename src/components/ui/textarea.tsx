import { cn } from '@/lib/utils'

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-30 w-full rounded-md border border-border bg-surface px-4 py-3 text-base text-foreground shadow-sm transition-[border-color,box-shadow,background-color] placeholder:text-text-muted hover:border-primary/25 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10 disabled:cursor-not-allowed disabled:bg-surface-alt disabled:opacity-70 lg:text-sm',
        className,
      )}
      {...props}
    />
  )
}
