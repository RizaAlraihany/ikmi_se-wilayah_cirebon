'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ButtonLink } from '@/components/ui/button'
import { IKMI_LOGO_URL } from '@/core/brand/assets'
import { cn } from '@/lib/utils'

const navLinks = [
  { label: 'Beranda', href: '/' },
  { label: 'Tentang', href: '/tentang-kami' },
  { label: 'Event', href: '/event' },
  { label: 'Struktur', href: '/struktur' },
  { label: 'Blog', href: '/blog' },
]

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [landingScrolled, setLandingScrolled] = useState(false)
  const pathname = usePathname()
  const isLanding = pathname === '/'
  const scrolled = !isLanding || landingScrolled
  const transparentOnDesktop = isLanding && !scrolled

  useEffect(() => {
    if (!isLanding) return

    let ticking = false
    const updateNavbar = () => {
      setLandingScrolled(window.scrollY >= 60)
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateNavbar)
        ticking = true
      }
    }

    window.requestAnimationFrame(updateNavbar)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isLanding])


  // Cegah scroll body saat menu mobile terbuka
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  return (
    <>
      <nav
        className={cn(
          'navbar-animate top-0 z-50 border-b',
          'transition-[background,backdrop-filter,box-shadow,border-color] duration-[350ms]',
          '[transition-timing-function:cubic-bezier(0.4,0,0.2,1)]',
          isLanding ? 'fixed inset-x-0' : 'sticky',
          transparentOnDesktop
            ? 'border-transparent bg-surface/95 shadow-none backdrop-blur-none md:bg-transparent'
            : 'border-border/60 bg-surface/80 shadow-[0_1px_0_rgba(0,23,105,0.08),0_4px_20px_rgba(0,23,105,0.06)] backdrop-blur-[16px] saturate-[180%]',
        )}
        aria-label="Navigasi Utama"
      >
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 md:h-16 md:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="Beranda IKMI Cirebon"
          >
            <Image
              src={IKMI_LOGO_URL}
              alt="Logo IKMI Cirebon"
              width={31}
              height={40}
              priority
              className="h-9 w-auto object-contain md:h-10"
            />
            <div className="leading-none">
              <p
                className={cn(
                  'font-heading text-[13px] font-extrabold transition-colors duration-300 md:text-sm',
                  transparentOnDesktop ? 'text-primary md:text-surface' : 'text-primary',
                )}
              >
                IKMI Cirebon
              </p>
              <p
                className={cn(
                  'text-[9px] font-medium transition-colors duration-300 md:text-[10px]',
                  transparentOnDesktop
                    ? 'text-text-secondary md:text-surface/72'
                    : 'text-text-secondary',
                )}
              >
                Se-Wilayah Cirebon
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    'nav-link-animated relative rounded-full px-3 py-2 text-sm font-semibold',
                    'transition-colors duration-200',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    transparentOnDesktop
                      ? '[text-shadow:0_1px_3px_rgba(0,0,0,0.3)] hover:text-surface'
                      : 'hover:text-primary',
                    transparentOnDesktop
                      ? isActive ? 'text-surface' : 'text-surface/88'
                      : isActive ? 'text-accent' : 'text-text-secondary',
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Desktop CTA + Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <ButtonLink
              href="/gabung"
              size="sm"
              className={cn(
                'hidden md:inline-flex transition-all',
                transparentOnDesktop
                  ? 'border border-surface/35 bg-surface/18 text-surface shadow-none hover:bg-surface/28'
                  : '',
              )}
              aria-label="Daftar menjadi anggota IKMI"
            >
              Daftar Anggota
            </ButtonLink>

            {/* Hamburger — animasi 3-line → X */}
            <button
              type="button"
              className={cn(
                'relative flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-xl md:hidden',
                'transition-colors duration-200',
                transparentOnDesktop
                  ? 'text-surface hover:bg-surface/10'
                  : 'text-text-primary hover:bg-surface-alt',
              )}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={mobileMenuOpen}
            >
              <span
                className={cn(
                  'block h-[2px] w-[22px] rounded-full bg-current transition-transform duration-300',
                  mobileMenuOpen && 'translate-y-[7px] rotate-45',
                )}
              />
              <span
                className={cn(
                  'block h-[2px] w-[22px] rounded-full bg-current transition-all duration-300',
                  mobileMenuOpen && 'scale-x-0 opacity-0',
                )}
              />
              <span
                className={cn(
                  'block h-[2px] w-[22px] rounded-full bg-current transition-transform duration-300',
                  mobileMenuOpen && '-translate-y-[7px] -rotate-45',
                )}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer — slide dari atas dengan stagger */}
      <div
        className={cn(
          'fixed inset-x-0 top-14 z-40 md:hidden',
          'bg-white/96 backdrop-blur-[20px]',
          'border-b border-border',
          'transition-[transform,opacity] duration-300',
          '[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
          mobileMenuOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-3 opacity-0',
        )}
      >
        <nav className="flex flex-col py-2" aria-label="Navigasi mobile">
          {navLinks.map((link, index) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  transitionDelay: mobileMenuOpen ? `${50 + index * 30}ms` : '0ms',
                }}
                className={cn(
                  'mobile-menu-item mx-3 flex min-h-10 items-center rounded-xl px-3.5 py-2.5',
                  'text-sm font-semibold transition-[background,color,opacity,transform] duration-200',
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-primary hover:bg-surface-alt',
                  mobileMenuOpen
                    ? 'translate-x-0 opacity-100'
                    : '-translate-x-3 opacity-0',
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-4 pb-4 pt-1">
          <ButtonLink
            href="/gabung"
            className="min-h-10 w-full justify-center text-sm"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              transitionDelay: mobileMenuOpen ? `${50 + navLinks.length * 30}ms` : '0ms',
            }}
          >
            Daftar Anggota
          </ButtonLink>
        </div>
      </div>

      {/* Backdrop overlay untuk mobile menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
