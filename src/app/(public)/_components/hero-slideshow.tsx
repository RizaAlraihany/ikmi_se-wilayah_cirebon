"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

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
  children?: ReactNode;
  mediaChildren?: ReactNode;
};

const AUTOPLAY_DELAY = 10000;

function splitTitle(title: string) {
  const words = title.trim().split(/\s+/);
  const splitAt = words.slice(1).reduce((best, _, index) => {
    const position = index + 1;
    const difference = Math.abs(words.slice(0, position).join(" ").length - words.slice(position).join(" ").length);
    const bestDifference = Math.abs(words.slice(0, best).join(" ").length - words.slice(best).join(" ").length);
    return difference < bestDifference ? position : best;
  }, 1);

  return [words.slice(0, splitAt).join(" "), words.slice(splitAt).join(" ")];
}

export function HeroSlideshow({ slides, eyebrow, title, description, motto, primaryCta, secondaryCta, children, mediaChildren }: HeroSlideshowProps) {
  const validSlides = useMemo(() => slides.filter((slide) => Boolean(slide.desktopImage) || Boolean(slide.mobileImage)), [slides]);
  const titleLines = splitTitle(title);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (activeIndex >= validSlides.length) setActiveIndex(0);
  }, [activeIndex, validSlides.length]);

  useEffect(() => {
    if (paused || validSlides.length <= 1) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % validSlides.length), AUTOPLAY_DELAY);
    return () => window.clearInterval(timer);
  }, [paused, validSlides.length]);

  useEffect(() => {
    if (!heroRef.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setIsHeroVisible(entry.isIntersecting), { threshold: 0 });
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  return <section ref={heroRef} id="hero-slider" className={`home-hero${isHeroVisible ? " is-visible" : ""}`} aria-labelledby="home-hero-title" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
    <div className="home-hero-content">
      <div className="home-hero-copy">
        <p className="home-hero-eyebrow">{eyebrow}</p>
        <h1 id="home-hero-title">{titleLines.map((line) => <span key={line}>{line}</span>)}</h1>
        <p className="home-hero-description">{description}</p>
        <blockquote className="home-hero-motto"><span aria-hidden="true">“</span>{motto}<span aria-hidden="true">”</span></blockquote>
        <div className="home-hero-actions"><Link href={primaryCta.href} className="home-hero-primary">{primaryCta.label}<ArrowRight aria-hidden="true" /></Link><Link href={secondaryCta.href} className="home-hero-secondary">{secondaryCta.label}<ArrowRight aria-hidden="true" /></Link></div>
        {children}
      </div>
    </div>
    <div className="home-hero-media-frame">
      <div className={`home-hero-media${validSlides.length ? "" : " home-hero-media--empty"}`} aria-label="Dokumentasi IKMI Cirebon">
        <div className="home-hero-mobile-gallery" aria-label="Galeri dokumentasi IKMI Cirebon">
          {validSlides.slice(0, 4).map((slide, index) => {
            const image = slide.mobileImage || slide.desktopImage;
            return image ? <div key={slide.id} className="home-hero-mobile-tile"><Image src={image} alt={slide.alt || `Dokumentasi IKMI Cirebon ${index + 1}`} fill sizes="50vw" className="home-hero-mobile-image" /></div> : null;
          })}
        </div>
        <div className="home-hero-slider" aria-live="polite">
          {validSlides.map((slide, index) => {
            const image = slide.desktopImage || slide.mobileImage;
            return image ? <Image key={slide.id} src={image} alt={slide.alt || "Dokumentasi IKMI Cirebon"} fill priority={index === 0} sizes="(min-width: 1024px) 62vw, 100vw" className={`home-hero-image${index === activeIndex ? " is-active" : ""}`} /> : null;
          })}
          {validSlides.length > 1 ? (
            <>
              <button type="button" className="home-hero-slider-control home-hero-slider-control--previous" aria-label="Foto sebelumnya" onClick={() => setActiveIndex((current) => current === 0 ? validSlides.length - 1 : current - 1)}><ChevronLeft aria-hidden="true" /></button>
              <button type="button" className="home-hero-slider-control home-hero-slider-control--next" aria-label="Foto berikutnya" onClick={() => setActiveIndex((current) => (current + 1) % validSlides.length)}><ChevronRight aria-hidden="true" /></button>
            </>
          ) : null}
          {validSlides.length > 1 ? <div className="home-hero-dots" aria-label="Pilih foto dokumentasi">{validSlides.map((slide, index) => <button key={slide.id} type="button" className={index === activeIndex ? "is-active" : ""} aria-label={`Tampilkan foto ${index + 1}`} aria-pressed={index === activeIndex} onClick={() => setActiveIndex(index)} />)}</div> : null}
        </div>
        <span className="home-hero-photo-blend" aria-hidden="true" />
      </div>
      {mediaChildren}
    </div>
  </section>;
}
