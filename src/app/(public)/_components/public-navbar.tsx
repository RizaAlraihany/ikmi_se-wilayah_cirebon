"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Dropdown, DropdownLink } from "@/components/ui/dropdown";
import { IKMI_LOGO_URL } from "@/core/brand/assets";
import { cn } from "@/lib/utils";

type NavigationLink = { label: string; href: string };
type NavigationItem = NavigationLink | { label: string; children: NavigationLink[] };

const navigation: NavigationItem[] = [
  { label: "Beranda", href: "/" },
  { label: "Tentang", href: "/tentang" },
  { label: "Publikasi", href: "/publikasi" },
  { label: "Kontak", href: "/kontak" },
];

function isActivePath(pathname: string, href: string) {
  const cleanHref = href.split(/[?#]/)[0];
  if (href.includes("#") && cleanHref === "/") return false;
  return cleanHref === "/"
    ? pathname === "/"
    : pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
}

export function PublicNavbar() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isScrolledRef = useRef(false);

  const closeNavigation = () => {
    setIsMobileOpen(false);
  };

  useEffect(() => {
    if (!isMobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      mobileMenuRef.current
        ?.querySelector<HTMLElement>("a[href], button:not([disabled])")
        ?.focus();
    });

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !mobileMenuRef.current) return;
      const focusable = Array.from(
        mobileMenuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", trapFocus);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", trapFocus);
      document.body.style.overflow = previousOverflow;
      menuButton?.focus();
    };
  }, [isMobileOpen]);

  useEffect(() => {
    let animationFrame = 0;

    const syncScrollState = () => {
      const scrollTop = Math.max(
        window.scrollY || 0,
        document.documentElement.scrollTop || 0,
        document.body.scrollTop || 0,
      );

      // Enter quickly, but keep a small hysteresis so the glass state does not
      // flicker when the page rests near the top.
      const threshold = isScrolledRef.current ? 12 : 24;
      const nextScrolled = scrollTop > threshold;

      if (nextScrolled !== isScrolledRef.current) {
        isScrolledRef.current = nextScrolled;
        setIsScrolled(nextScrolled);
      }
    };

    const handleScroll = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        syncScrollState();
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    syncScrollState();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const desktopBreakpoint = window.matchMedia("(min-width: 1024px)");
    const closeHiddenNavigation = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMobileOpen(false);
      }
    };

    desktopBreakpoint.addEventListener("change", closeHiddenNavigation);
    return () =>
      desktopBreakpoint.removeEventListener("change", closeHiddenNavigation);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeNavigation();
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className={cn("site-header text-white", isScrolled && "is-scrolled")}
      data-scroll-state={isScrolled ? "floating" : "attached"}
    >
      <div className="flex items-center justify-between gap-4 nav-shell">
        <Link
          href="/"
          className="flex min-h-11 min-w-0 items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          aria-label="Beranda IKMI Cirebon"
          onClick={closeNavigation}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm shadow-sm">
            <Image
              src={IKMI_LOGO_URL}
              alt="Logo IKMI Cirebon"
              width={28}
              height={36}
              priority
              className="h-8 w-auto"
            />
          </span>
          <span className="min-w-0">
            <span className="block font-heading text-sm font-extrabold text-white">
              IKMI Cirebon
            </span>
            <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-white/65">
              Se-Wilayah Cirebon
            </span>
          </span>
        </Link>

        <nav
          className="hidden h-full items-center lg:flex gap-1"
          aria-label="Navigasi utama"
        >
          {navigation.map((item) => {
            if ("children" in item) {
              const active = item.children.some((child) => isActivePath(pathname, child.href));

              return (
                <Dropdown
                  key={item.label}
                  label={`Buka menu ${item.label}`}
                  align="start"
                  active={active}
                  className="desktop-dropdown flex h-full items-center"
                  triggerClassName={cn(
                    "desk-nav-item nav-action group gap-1 px-4 text-sm font-medium transition-colors hover:text-white",
                    active ? "font-bold text-white" : "text-white/80",
                  )}
                  menuClassName="public-nav-dropdown-menu min-w-56 border-white/90 bg-white/95 p-2 shadow-float backdrop-blur-xl"
                  trigger={(
                    <>
                      <span>{item.label}</span>
                      <ChevronDown
                        className="h-4 w-4 transition-transform group-aria-expanded:rotate-180 motion-reduce:transition-none"
                        aria-hidden="true"
                      />
                    </>
                  )}
                >
                  {item.children.map((child) => {
                    const childActive = isActivePath(pathname, child.href);
                    return (
                      <DropdownLink
                        key={child.href}
                        href={child.href}
                        ariaCurrent={childActive ? "page" : undefined}
                        className={cn(
                          "text-primary hover:bg-surface-alt hover:text-accent",
                          childActive && "bg-surface-alt text-accent",
                        )}
                      >
                        {child.label}
                      </DropdownLink>
                    );
                  })}
                </Dropdown>
              );
            }

            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={closeNavigation}
                className={cn(
                  "desk-nav-item nav-action flex h-full items-center px-4 text-sm font-medium transition-colors hover:text-white",
                  active ? "font-bold text-white" : "text-white/80",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink
            href="/gabung"
            variant="secondary"
            size="sm"
            onClick={closeNavigation}
            className="hidden whitespace-nowrap border-white/50 bg-white text-primary shadow-none hover:bg-white/90 lg:inline-flex"
          >
            Gabung Bersama Kami
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:hidden"
            onClick={() => {
              setIsMobileOpen((open) => !open);
            }}
            aria-label={isMobileOpen ? "Tutup navigasi" : "Buka navigasi"}
            aria-expanded={isMobileOpen}
            aria-controls="public-mobile-navigation"
          >
            {isMobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div
        ref={mobileMenuRef}
        id="public-mobile-navigation"
        aria-hidden={!isMobileOpen}
        inert={!isMobileOpen}
        className={cn(
          "mobile-public-menu fixed left-3 top-[70px] w-[calc(100%-24px)] max-h-[calc(100dvh-88px)] overflow-y-auto px-4 py-5 transition-[opacity,transform,visibility] duration-200 lg:hidden",
          isMobileOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-2 opacity-0 pointer-events-none",
        )}
      >
        <nav className="mx-auto max-w-[1200px]" aria-label="Navigasi mobile">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
            Navigasi utama
          </p>
          <div className="mt-3 divide-y divide-white/10 border-y border-white/10">
            {navigation.map((item) => {
              if ("children" in item) {
                return (
                  <div key={item.label} className="py-2">
                    <p className="px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
                      {item.label}
                    </p>
                    <div>
                      {item.children.map((child) => {
                        const childActive = isActivePath(pathname, child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            aria-current={childActive ? "page" : undefined}
                            onClick={closeNavigation}
                            className={cn(
                              "mob-nav-item flex min-h-12 items-center px-4 pl-7 font-heading text-base font-extrabold",
                              childActive ? "text-white" : "text-white/80",
                            )}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={closeNavigation}
                  className={cn(
                    "mob-nav-item flex min-h-12 items-center px-4 font-heading text-base font-extrabold",
                    active ? "text-white" : "text-white/80",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <ButtonLink
            href="/gabung"
            variant="secondary"
            onClick={closeNavigation}
            className="mt-5 w-full border-white/50 bg-white text-primary shadow-none hover:bg-white/90"
          >
            Gabung Bersama Kami
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
