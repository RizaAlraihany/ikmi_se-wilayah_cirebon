import { cn } from '@/lib/utils'

type BadgeTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'surface'

const tones: Record<BadgeTone, string> = {
  primary: 'bg-accent text-surface',
  accent: 'bg-accent text-surface',
  success: 'bg-success-surface text-success-foreground',
  warning: 'bg-warning-surface text-warning-foreground',
  danger: 'bg-danger-surface text-danger-foreground',
  surface: 'bg-surface-alt text-primary ring-1 ring-border',
}

export function Badge({
  tone = 'surface',
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; variant?: 'default' | 'secondary' | 'outline' | 'destructive' }) {
  const resolvedTone =
    tone !== 'surface'
      ? tone
      : variant === 'default'
        ? 'primary'
        : variant === 'destructive'
          ? 'danger'
          : 'surface'

  return (
    <span
      className={cn(
        'inline-flex min-h-6 items-center rounded-md px-2.5 py-1 text-[11px] font-bold tracking-[0.01em]',
        tones[resolvedTone],
        className,
      )}
      {...props}
    />
  )
}
