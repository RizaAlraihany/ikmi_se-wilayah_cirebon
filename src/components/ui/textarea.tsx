import { cn } from '@/lib/utils'

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-28 w-full rounded-xl bg-surface px-4 py-3 text-sm text-primary ring-1 ring-line transition placeholder:text-muted focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}
