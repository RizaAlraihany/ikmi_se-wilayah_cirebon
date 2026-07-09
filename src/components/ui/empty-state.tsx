import { LucideIcon } from 'lucide-react'
import { ButtonLink } from './button'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 text-accent">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="font-heading text-lg font-bold text-primary">{title}</h3>
        <p className="text-sm text-muted">{description}</p>
      </div>
      {actionHref && actionLabel ? (
        <ButtonLink href={actionHref} size="sm">
          {actionLabel}
        </ButtonLink>
      ) : null}
    </div>
  )
}
