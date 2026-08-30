"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type PublicHeroSlide = {
  id: string;
  desktopImage?: string | null;
  mobileImage?: string | null;
  alt?: string;
};

type HeroAction = { label: string; href: string };
type HeroSlideshowProps = {
  slides: PublicHeroSlide[];
  eyebrow: string;
  title: string;
  description: string;
  motto: string;
  primaryCta: HeroAction;
  secondaryCta: HeroAction;
};

const AUTOPLAY_DELAY = 10000;

export function HeroSlideshow({ slides, eyebrow, title, description, motto, primaryCta, secondaryCta }: HeroSlideshowProps) {
  const validSlides = useMemo(() => slides.filter((slide) => Boolean(slide.desktopImage) || Boolean(slide.mobileImage)), [slides]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (activeIndex >= validSlides.length) setActiveIndex(0);
  }, [activeIndex, validSlides.length]);

  useEffect(() => {
    if (paused || validSlides.length <= 1) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % validSlides.length), AUTOPLAY_DELAY);
    return () => window.clearInterval(timer);
  }, [paused, validSlides.length]);

  return <section id="hero-slider" className="home-hero" aria-labelledby="home-hero-title" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
    <div className="home-hero-content">
      <div className="home-hero-copy">
        <p className="home-hero-eyebrow">{eyebrow}</p>
        <h1 id="home-hero-title">{title}</h1>
        <p className="home-hero-description">{description}</p>
        <blockquote className="home-hero-motto"><span aria-hidden="true">“</span>{motto}<span aria-hidden="true">”</span></blockquote>
        <div className="home-hero-actions"><Link href={primaryCta.href} className="home-hero-primary">{primaryCta.label}<ArrowRight aria-hidden="true" /></Link><Link href={secondaryCta.href} className="home-hero-secondary">{secondaryCta.label}<ArrowRight aria-hidden="true" /></Link></div>
      </div>
    </div>
    <div className={`home-hero-media${validSlides.length ? "" : " home-hero-media--empty"}`} aria-label="Dokumentasi IKMI Cirebon">
      {validSlides.map((slide, index) => {
        const image = slide.desktopImage || slide.mobileImage;
        return image ? <Image key={slide.id} src={image} alt={slide.alt || "Dokumentasi IKMI Cirebon"} fill priority={index === 0} sizes="(min-width: 1024px) 62vw, 100vw" className={`home-hero-image${index === activeIndex ? " is-active" : ""}`} /> : null;
      })}
      <span className="home-hero-photo-blend" aria-hidden="true" />
      {validSlides.length > 1 ? <div className="home-hero-dots" aria-label="Pilih foto dokumentasi">{validSlides.map((slide, index) => <button key={slide.id} type="button" className={index === activeIndex ? "is-active" : ""} aria-label={`Tampilkan foto ${index + 1}`} aria-pressed={index === activeIndex} onClick={() => setActiveIndex(index)} />)}</div> : null}
    </div>
  </section>;
}
