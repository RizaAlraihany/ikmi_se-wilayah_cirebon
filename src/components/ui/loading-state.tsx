import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LoadingState({
  label = 'Memuat data…',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex min-h-40 flex-col items-center justify-center gap-3 px-6 py-10 text-center', className)}
    >
      <LoaderCircle className="h-6 w-6 animate-spin text-accent motion-reduce:animate-none" aria-hidden="true" />
      <p className="text-sm font-medium text-text-secondary">{label}</p>
    </div>
  )
}
