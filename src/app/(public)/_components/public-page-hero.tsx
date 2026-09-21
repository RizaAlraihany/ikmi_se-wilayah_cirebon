import type { ReactNode } from 'react'
import { GlobalPageHeader, type GlobalPageHeaderProps } from './global-page-header'

export type PublicPageHeroProps = Omit<GlobalPageHeaderProps, 'description' | 'aside'> & {
  lead?: ReactNode
}

export function PublicPageHero({
  items,
  title,
  lead,
  eyebrow,
  image,
  imageAlt,
  children,
  className = '',
}: PublicPageHeroProps) {
  return <GlobalPageHeader items={items} title={title} description={lead} eyebrow={eyebrow} image={image} imageAlt={imageAlt} className={className}>{children}</GlobalPageHeader>
}
