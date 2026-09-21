import type { ReactNode } from 'react'
import Image from 'next/image'
import { PublicBreadcrumb } from './public-breadcrumb'

export type GlobalPageHeaderBreadcrumbItem = {
  label: string
  href?: string
}

export type GlobalPageHeaderProps = {
  items: GlobalPageHeaderBreadcrumbItem[]
  title: ReactNode
  description?: ReactNode
  eyebrow?: string
  image?: string | null
  imageAlt?: string
  children?: ReactNode
  aside?: ReactNode
  className?: string
  id?: string
}

const DEFAULT_HEADER_IMAGE =
  'https://res.cloudinary.com/fvggnar7/image/upload/v1789385069/BPHU.png'

/**
 * Shared public-page header. It follows the compact Struktur spacing while
 * keeping the content and optional summary card supplied by each page.
 */
export function GlobalPageHeader({
  items,
  title,
  description,
  eyebrow,
  image = DEFAULT_HEADER_IMAGE,
  imageAlt = 'Dokumentasi IKMI Se-Wilayah Cirebon',
  children,
  aside,
  className = '',
  id,
}: GlobalPageHeaderProps) {
  return (
    <header id={id} className={`global-page-header ${className}`.trim()}>
      {image ? (
        <div className="global-page-header__media" aria-hidden="true">
          <Image
            src={image}
            alt={imageAlt}
            fill
            priority
            sizes="100vw"
            className="global-page-header__image"
          />
          <span className="global-page-header__overlay" />
        </div>
      ) : null}

      <div className="public-container global-page-header__inner">
        <PublicBreadcrumb items={items} tone="inverse" className="global-page-header__breadcrumb" />
        <div className={`global-page-header__layout${aside ? ' global-page-header__layout--with-aside' : ''}`}>
          <div className="global-page-header__copy">
            {eyebrow ? <p className="global-page-header__eyebrow">{eyebrow}</p> : null}
            <h1 className="global-page-header__title">{title}</h1>
            {description ? <p className="global-page-header__description">{description}</p> : null}
            {children}
          </div>
          {aside ? <div className="global-page-header__aside">{aside}</div> : null}
        </div>
      </div>
    </header>
  )
}
