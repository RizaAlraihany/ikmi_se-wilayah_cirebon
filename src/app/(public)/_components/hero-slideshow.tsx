'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CalendarDays, ChevronDown, ChevronUp, Newspaper, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'

export type PublicHeroSlide = {
  id: string
  desktopImage?: string | null
  mobileImage?: string | null
  alt?: string
}

export type HeroFloatingBadge = {
  id: 'agenda' | 'join' | 'publication' | string
  label: string
  description?: string
  href: string
  icon?: 'agenda' | 'join' | 'publication'
  actionLabel?: string
}

type HeroAction = { label: string; href: string }

export type HeroSlideshowProps = {
  slides: PublicHeroSlide[]
  eyebrow: string
  title: string
  description: string
  motto: string
  primaryCta: HeroAction
  secondaryCta: HeroAction
  floatingBadges?: HeroFloatingBadge[]
  departmentLogos?: string[]
}

const DEPARTMENT_NAMES: Record<string, string> = {
  bph: 'BPH',
  kaderisasi: 'Kaderisasi',
  kajian: 'Kajian & Aksi',
  psda: 'PSDA',
  ekotif: 'Ekotif',
  komdigi: 'Komdigi',
  hpm: 'HPM',
}

function getDepartmentName(url: string, index: number): string {
  const lower = url.toLowerCase()
  for (const [key, name] of Object.entries(DEPARTMENT_NAMES)) {
    if (lower.includes(key)) return name
  }
  return `Departemen ${index + 1}`
}

function renderBadgeIcon(icon?: 'agenda' | 'join' | 'publication') {
  switch (icon) {
    case 'agenda':
      return <CalendarDays className="home-hero-badge-svg" aria-hidden="true" />
    case 'join':
      return <UserPlus className="home-hero-badge-svg" aria-hidden="true" />
    case 'publication':
      return <Newspaper className="home-hero-badge-svg" aria-hidden="true" />
    default:
      return null
  }
}

export function HeroSlideshow({
  slides,
  eyebrow,
  title,
  description,
  motto,
  primaryCta,
  secondaryCta,
  floatingBadges,
  departmentLogos,
}: HeroSlideshowProps) {
  const validSlides = useMemo(() => slides.filter((slide) => Boolean(slide.desktopImage) || Boolean(slide.mobileImage)), [slides])
  const [activeIndex, setActiveIndex] = useState(0)
  const multi = validSlides.length > 1

  function move(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + validSlides.length) % validSlides.length)
  }

  // Duplicate logos 4x to ensure smooth infinite loop on all screen widths
  const marqueeList = useMemo(() => {
    if (!departmentLogos || departmentLogos.length === 0) return []
    return [...departmentLogos, ...departmentLogos, ...departmentLogos, ...departmentLogos]
  }, [departmentLogos])

  return (
    <section id="hero-slider" className="home-hero" aria-labelledby="home-hero-title">
      {/* Desktop only: floating button TOP — separate element */}
      {multi ? (
        <button type="button" className="home-hero-float-top" aria-label="Foto sebelumnya" onClick={() => move(-1)}>
          <ChevronUp aria-hidden="true" />
        </button>
      ) : null}

      <div className="home-hero-content">
        <div className="home-hero-copy">
          <p className="home-hero-eyebrow">{eyebrow}</p>
          <h1 id="home-hero-title">{title}</h1>
          <p className="home-hero-description">{description}</p>
          <blockquote className="home-hero-motto"><span aria-hidden="true">&ldquo;</span>{motto}<span aria-hidden="true">&rdquo;</span></blockquote>
          <div className="home-hero-actions">
            <Link href={primaryCta.href} className="home-hero-primary">{primaryCta.label}<ArrowRight aria-hidden="true" /></Link>
            <Link href={secondaryCta.href} className="home-hero-secondary">{secondaryCta.label}<ArrowRight aria-hidden="true" /></Link>
          </div>
        </div>

        <div className="home-hero-media-wrapper">
          <div className={`home-hero-media${validSlides.length ? '' : ' home-hero-media--empty'}`} aria-label="Dokumentasi IKMI Cirebon">
            {validSlides.map((slide, index) => {
              const image = slide.desktopImage || slide.mobileImage
              return image ? <Image key={slide.id} src={image} alt={slide.alt || `Dokumentasi IKMI Cirebon ${index + 1}`} fill priority={index === 0} sizes="(min-width: 1024px) 62vw, 100vw" className={`home-hero-image${index === activeIndex ? ' is-active' : ''}`} /> : null
            })}
            <span className="home-hero-photo-blend" aria-hidden="true" />

            {/* Mobile/tablet: ←→ arrows inside the photo */}
            {multi ? (
              <div className="home-hero-mobile-controls" aria-label="Kontrol foto dokumentasi">
                <button type="button" aria-label="Foto sebelumnya" onClick={() => move(-1)}><ArrowLeft aria-hidden="true" /></button>
                <button type="button" aria-label="Foto berikutnya" onClick={() => move(1)}><ArrowRight aria-hidden="true" /></button>
              </div>
            ) : null}
          </div>

          {/* Floating Badges — Spaced apart, not grouped in one component */}
          {floatingBadges && floatingBadges.length > 0 ? (
            <div className="home-hero-floating-badges" aria-label="Akses cepat">
              {floatingBadges.map((badge) => (
                <Link
                  key={badge.id}
                  href={badge.href}
                  className={`home-hero-badge home-hero-badge--${badge.id}`}
                >
                  {badge.icon ? (
                    <span className={`home-hero-badge-icon home-hero-badge-icon--${badge.id}`}>
                      {renderBadgeIcon(badge.icon)}
                    </span>
                  ) : null}
                  <span className="home-hero-badge-text">
                    <span className="home-hero-badge-label">{badge.label}</span>
                    {badge.description ? (
                      <span className="home-hero-badge-desc">{badge.description}</span>
                    ) : null}
                  </span>
                  {badge.actionLabel ? (
                    <span className="home-hero-badge-action">
                      {badge.actionLabel}
                      <ArrowRight aria-hidden="true" />
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Desktop only: floating button BOTTOM — separate element */}
      {multi ? (
        <button type="button" className="home-hero-float-bottom" aria-label="Foto berikutnya" onClick={() => move(1)}>
          <ChevronDown aria-hidden="true" />
        </button>
      ) : null}

      {/* Infinite scrolling structure/department logos marquee */}
      {marqueeList.length > 0 ? (
        <div className="home-hero-marquee-band" aria-label="Struktur Departemen IKMI Cirebon">
          <div className="home-hero-marquee-track">
            {marqueeList.map((logoUrl, idx) => {
              const name = getDepartmentName(logoUrl, idx % (departmentLogos?.length || 1))
              return (
                <div key={`${logoUrl}-${idx}`} className="home-hero-marquee-item">
                  <div className="home-hero-marquee-logo-wrap">
                    <Image
                      src={logoUrl}
                      alt={`Logo ${name}`}
                      width={32}
                      height={32}
                      className="home-hero-marquee-logo"
                    />
                  </div>
                  <span className="home-hero-marquee-name">{name}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </section>
  )
}
