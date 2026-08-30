import { ReactNode } from 'react'
import Image from 'next/image'
import { PublicBreadcrumb } from './public-breadcrumb'

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
  'https://res.cloudinary.com/dsgldeuuy/image/upload/v1781210005/BPHU_rkqdtg.png'

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
          {eyebrow ? <p className="public-page-eyebrow">{eyebrow}</p> : null}
          {typeof title === 'string' ? (
            <h1 className="public-page-title">{title}</h1>
          ) : (
            title
          )}
          {lead ? (
            typeof lead === 'string' ? (
              <p className="public-page-lead">{lead}</p>
            ) : (
              lead
            )
          ) : null}
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
