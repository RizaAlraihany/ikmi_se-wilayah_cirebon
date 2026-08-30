import { AlertCircle } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

export function ErrorState({
  title = 'Data belum dapat dimuat',
  description = 'Terjadi kendala saat memuat data. Silakan coba lagi.',
  retryLabel = 'Coba lagi',
  onRetry,
  className,
}: {
  title?: string
  description?: string
  retryLabel?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div className={cn('flex min-h-40 flex-col items-start justify-center gap-4 border-l-2 border-danger px-5 py-8 text-left', className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-danger-surface text-danger-foreground">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="font-heading text-lg font-bold text-primary">{title}</h3>
        <p className="text-sm leading-6 text-text-secondary">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  )
}
