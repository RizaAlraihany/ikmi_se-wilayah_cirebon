import { ReactNode } from 'react'
import Image from 'next/image'
import { PublicBreadcrumb } from './public-breadcrumb'
import { GlobalSectionHeader } from '@/components/global-section-header'

type BreadcrumbItem = {
  label: string
  href?: string
}

export type PublicPageHeroProps = {
  items: BreadcrumbItem[]
  title: ReactNode
  lead?: ReactNode
  eyebrow?: string
  image?: string | null
  imageAlt?: string
  children?: ReactNode
  className?: string
}

const DEFAULT_HERO_IMAGE =
  'https://res.cloudinary.com/fvggnar7/image/upload/v1789385069/BPHU.png'

export function PublicPageHero({
  items,
  title,
  lead,
  eyebrow,
  image = DEFAULT_HERO_IMAGE,
  imageAlt = 'Dokumentasi IKMI Se-Wilayah Cirebon',
  children,
  className = '',
}: PublicPageHeroProps) {
  return (
    <header className={`public-page-header ${className}`.trim()}>
      <div className="public-header-content">
        <div className="public-header-copy">
          <PublicBreadcrumb items={items} tone="inverse" />
          {typeof title === 'string' ? (
            <GlobalSectionHeader
              as="h1"
              title={title}
              description={typeof lead === 'string' ? lead : undefined}
              eyebrow={eyebrow}
              inverse
              className="public-page-heading"
            />
          ) : (
            <>
              {eyebrow ? <p className="public-page-eyebrow">{eyebrow}</p> : null}
              {title}
              {lead}
            </>
          )}
          {children}
        </div>
      </div>

      {image ? (
        <div className="public-header-media" aria-hidden="true">
          <Image
            src={image}
            alt={imageAlt}
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="public-header-image"
          />
          <span className="public-header-photo-blend" aria-hidden="true" />
        </div>
      ) : null}
    </header>
  )
}
