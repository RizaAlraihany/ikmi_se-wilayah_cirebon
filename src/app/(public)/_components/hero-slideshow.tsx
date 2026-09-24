'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import { useMemo, useState } from 'react'

export type PublicHeroSlide = {
  id: string
  desktopImage?: string | null
  mobileImage?: string | null
  alt?: string
}

type HeroAction = { label: string; href: string }
type HeroSlideshowProps = {
  slides: PublicHeroSlide[]
  eyebrow: string
  title: string
  description: string
  motto: string
  primaryCta: HeroAction
  secondaryCta: HeroAction
}

export function HeroSlideshow({ slides, eyebrow, title, description, motto, primaryCta, secondaryCta }: HeroSlideshowProps) {
  const validSlides = useMemo(() => slides.filter((slide) => Boolean(slide.desktopImage) || Boolean(slide.mobileImage)), [slides])
  const [activeIndex, setActiveIndex] = useState(0)
  const multi = validSlides.length > 1

  function move(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + validSlides.length) % validSlides.length)
  }

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
      </div>

      {/* Desktop only: floating button BOTTOM — separate element */}
      {multi ? (
        <button type="button" className="home-hero-float-bottom" aria-label="Foto berikutnya" onClick={() => move(1)}>
          <ChevronDown aria-hidden="true" />
        </button>
      ) : null}
    </section>
  )
}
