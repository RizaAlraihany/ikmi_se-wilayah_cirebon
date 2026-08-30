import { Badge } from './badge'

type StatusTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'surface'

const statusTones: Record<string, StatusTone> = {
  active: 'success',
  approved: 'success',
  completed: 'success',
  published: 'success',
  verified: 'success',
  scheduled: 'accent',
  in_progress: 'accent',
  processing: 'accent',
  pending: 'warning',
  review: 'warning',
  draft: 'surface',
  archived: 'surface',
  inactive: 'surface',
  rejected: 'danger',
  cancelled: 'danger',
  failed: 'danger',
  error: 'danger',
}

function formatStatus(status: string) {
  return status
    .replaceAll('_', ' ')
    .toLocaleLowerCase('id-ID')
    .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('id-ID'))
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string
  label?: string
  className?: string
}) {
  const normalizedStatus = status.trim().toLocaleLowerCase('id-ID').replaceAll(' ', '_')

  return (
    <Badge tone={statusTones[normalizedStatus] ?? 'surface'} className={className}>
      {label ?? formatStatus(status)}
    </Badge>
  )
}
