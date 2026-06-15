"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type HeroSlide = {
  url: string;
  label: string;
};

interface HeroSlideshowProps {
  children: React.ReactNode;
  slides: HeroSlide[];
  departmentLogos: string[];
}

export function HeroSlideshow({
  children,
  slides,
  departmentLogos,
}: HeroSlideshowProps) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const activeSlides = slides.filter((slide) => slide.url);
  const logos = departmentLogos.filter(Boolean);

  const goToSlide = (index: number) => {
    if (activeSlides.length === 0) return;
    setCurrent((index + activeSlides.length) % activeSlides.length);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (activeSlides.length <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % activeSlides.length);
    }, 5000);

    return () => stopTimer();
  }, [activeSlides.length]);

  const handleMouseEnter = () => stopTimer();
  const handleMouseLeave = () => {
    stopTimer();
    if (activeSlides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % activeSlides.length);
    }, 5000);
  };

  const scrollToNext = () => {
    const section = sectionRef.current;
    if (!section) return;
    const nextEl = section.nextElementSibling as HTMLElement | null;
    nextEl?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[84svh] overflow-hidden md:min-h-[100svh]"
      aria-labelledby="hero-heading"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute inset-0" aria-hidden="true">
        {activeSlides.map((slide, index) => (
          <div
            key={`${slide.url}-${index}`}
            className={`hero-slide${index === current ? " active" : ""}`}
            style={{
              backgroundImage: `url("${slide.url}")`,
              backgroundPosition: "center",
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
            }}
            role="img"
            aria-label={slide.label}
          />
        ))}
      </div>

      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,23,105,0.52) 0%, rgba(0,23,105,0.25) 40%, rgba(0,23,105,0.68) 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-[2] flex min-h-[84svh] items-center px-4 pb-24 pt-20 md:min-h-[100svh] md:px-6 md:pb-32 md:pt-24 lg:px-8">
        <div className="mx-auto w-full max-w-[1200px]">{children}</div>
      </div>

      {activeSlides.length > 1 ? (
        <div
          className="absolute bottom-24 right-4 z-[3] flex flex-col gap-1.5 md:bottom-28 md:right-6"
          aria-label="Indikator slide hero"
        >
          {activeSlides.map((slide, index) => (
            <button
              key={`${slide.url}-${index}`}
              onClick={() => {
                stopTimer();
                goToSlide(index);
              }}
              aria-label={`Pergi ke slide ${index + 1}: ${slide.label}`}
              className={`rounded-full transition-all duration-300 ${
                index === current
                  ? "h-[18px] w-1.5 bg-white"
                  : "h-1.5 w-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      ) : null}

      <button
        onClick={scrollToNext}
        className="scroll-hint hero-scroll-hint-animate absolute bottom-16 left-1/2 z-[3] flex -translate-x-1/2 flex-col items-center gap-0.5 text-white/70 transition-colors hover:text-white focus-visible:outline-none md:bottom-[80px] md:gap-1"
        aria-label="Gulir ke bawah"
      >
          <span className="text-[9px] font-medium uppercase tracking-widest md:text-[10px]">
          Scroll
        </span>
        <ChevronDown className="h-5 w-5" />
      </button>

      {logos.length > 0 ? (
        <div className="absolute bottom-0 left-0 z-[4] w-full overflow-hidden py-3 md:py-4">
          <div className="flex w-[200%] animate-marquee items-center">
            {[...logos, ...logos].map((logo, index) => (
              <div
                key={`${logo}-${index}`}
                className="flex flex-1 justify-center px-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo}
                  alt={`Logo Departemen ${index + 1}`}
                  className="h-7 w-auto object-contain opacity-75 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 md:h-10"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
