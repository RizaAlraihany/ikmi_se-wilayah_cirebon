import { AlertCircle, CheckCircle2, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type AlertTone = 'info' | 'success' | 'warning' | 'danger'

const alertStyles: Record<AlertTone, { className: string; icon: LucideIcon }> = {
  info: { className: 'border-info/20 bg-info-surface text-info-foreground', icon: Info },
  success: { className: 'border-success/20 bg-success-surface text-success-foreground', icon: CheckCircle2 },
  warning: { className: 'border-warning/25 bg-warning-surface text-warning-foreground', icon: TriangleAlert },
  danger: { className: 'border-danger/20 bg-danger-surface text-danger-foreground', icon: AlertCircle },
}

export function Alert({
  tone = 'info',
  title,
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  tone?: AlertTone
  title?: string
}) {
  const { className: toneClassName, icon: Icon } = alertStyles[tone]

  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-md border p-4 text-sm leading-6', toneClassName, className)}
      {...props}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title ? <p className="font-bold">{title}</p> : null}
        <div className={title ? 'mt-0.5' : undefined}>{children}</div>
      </div>
    </div>
  )
}
