'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Newspaper, UserPlus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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

  // Auto-advance photos every 5 seconds on desktop and mobile
  useEffect(() => {
    if (!multi) return
    const timer = setInterval(() => {
      setActiveIndex((curr) => (curr + 1) % validSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [multi, validSlides.length])

  // Duplicate logos 4x to ensure smooth infinite loop on all screen widths
  const marqueeList = useMemo(() => {
    if (!departmentLogos || departmentLogos.length === 0) return []
    return [...departmentLogos, ...departmentLogos, ...departmentLogos, ...departmentLogos]
  }, [departmentLogos])

  return (
    <section id="hero-slider" className="home-hero" aria-labelledby="home-hero-title">
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

          {/* Desktop indicator dots beside the media */}
          {multi ? (
            <div className="home-hero-dots" aria-label="Navigasi foto dokumentasi">
              {validSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  className={`home-hero-dot${index === activeIndex ? ' is-active' : ''}`}
                  aria-label={`Foto ${index + 1}`}
                  aria-current={index === activeIndex ? 'true' : undefined}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
          ) : null}

          {/* Floating Badges — Liquid glass style, compact font, subtle arrow hint */}
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
                  <span className="home-hero-badge-arrow" aria-hidden="true">
                    <ArrowUpRight className="home-hero-badge-arrow-svg" />
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Infinite scrolling structure/department logos marquee (Logos ONLY, no text) */}
      {marqueeList.length > 0 ? (
        <div className="home-hero-marquee-band" aria-label="Struktur Departemen IKMI Cirebon">
          <div className="home-hero-marquee-track">
            {marqueeList.map((logoUrl, idx) => (
              <div key={`${logoUrl}-${idx}`} className="home-hero-marquee-item">
                <div className="home-hero-marquee-logo-wrap">
                  <Image
                    src={logoUrl}
                    alt="Logo Departemen IKMI Cirebon"
                    width={60}
                    height={60}
                    className="home-hero-marquee-logo"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
