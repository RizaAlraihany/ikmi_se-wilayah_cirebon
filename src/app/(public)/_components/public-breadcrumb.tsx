import { Fragment } from 'react'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'

type PublicBreadcrumbItem = {
  label: string
  href?: string
}

type PublicBreadcrumbProps = {
  items: PublicBreadcrumbItem[]
  tone?: 'default' | 'inverse'
  className?: string
}

export function PublicBreadcrumb({
  items,
  tone = 'default',
  className = '',
}: PublicBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`public-breadcrumb public-breadcrumb--${tone} ${className}`.trim()}
    >
      <Link href="/" aria-label="Beranda">
        <Home aria-hidden="true" />
        <span>Beranda</span>
      </Link>

      {items.map((item, index) => {
        const isCurrent = index === items.length - 1

        return (
          <Fragment key={`${item.href ?? 'current'}-${item.label}`}>
            <ChevronRight aria-hidden="true" />
            {item.href && !isCurrent ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current={isCurrent ? 'page' : undefined}>
                {item.label}
              </span>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
