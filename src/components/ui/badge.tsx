import { cn } from '@/lib/utils'

type BadgeTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'surface'

const tones: Record<BadgeTone, string> = {
  primary: 'bg-primary text-surface',
  accent: 'bg-accent text-surface',
  success: 'bg-success text-primary',
  warning: 'bg-warning text-primary',
  danger: 'bg-danger text-primary',
  surface: 'bg-surface text-primary ring-1 ring-line',
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
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        tones[resolvedTone],
        className,
      )}
      {...props}
    />
  )
}
