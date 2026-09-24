import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type GlobalSectionHeaderProps = {
  as?: ElementType
  title: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  id?: string
  inverse?: boolean
  className?: string
}

export function GlobalSectionHeader({ as: Heading = 'h2', title, description, eyebrow, id, inverse = false, className }: GlobalSectionHeaderProps) {
  return (
    <div className={cn('global-section-header', inverse && 'global-section-header--inverse', className)}>
      {eyebrow ? <p className="global-section-eyebrow">{eyebrow}</p> : null}
      <Heading id={id} className="global-section-title">{title}</Heading>
      {description ? <p className="global-section-description">{description}</p> : null}
    </div>
  )
}
