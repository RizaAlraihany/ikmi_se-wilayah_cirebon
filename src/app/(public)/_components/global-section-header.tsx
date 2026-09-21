import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type HeadingLevel = 'h2' | 'h3'

type GlobalSectionHeaderProps = {
  title: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  as?: HeadingLevel
  id?: string
  className?: string
}

/** Shared section-heading hierarchy for public pages. */
export function GlobalSectionHeader({
  title,
  description,
  eyebrow,
  as: Heading = 'h2',
  id,
  className,
}: GlobalSectionHeaderProps) {
  return (
    <header className={cn('global-section-header', className)}>
      {eyebrow ? <p className="global-section-header__eyebrow">{eyebrow}</p> : null}
      <Heading id={id} className="global-section-header__title">{title}</Heading>
      {description ? <p className="global-section-header__description">{description}</p> : null}
    </header>
  )
}
