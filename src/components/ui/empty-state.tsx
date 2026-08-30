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
    <div className="flex flex-col items-start justify-center gap-4 border-l-2 border-accent px-5 py-8 text-left">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/5 text-accent">
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
