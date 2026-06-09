'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/button'

const navLinks = [
  { label: 'Beranda', href: '/' },
  { label: 'Tentang Kami', href: '/tentang-kami' },
  { label: 'Event', href: '/event' },
  { label: 'Struktur', href: '/struktur' },
  { label: 'Blog', href: '/blog' },
]

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav
      className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur-md"
      aria-label="Navigasi Utama"
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-4 md:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="Beranda IKMI Cirebon"
        >
          <Image
            src="/ikmi-logo.png"
            alt="Logo IKMI Cirebon"
            width={40}
            height={40}
            className=""
            priority
          />
          <div className="leading-none">
            <p className="font-heading text-sm font-extrabold text-primary">
              IKMI Cirebon
            </p>
            <p className="text-[10px] font-medium text-muted">
              Se-Wilayah Cirebon
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-7 text-sm font-semibold text-primary/70 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA + Hamburger */}
        <div className="flex items-center gap-3">
          <ButtonLink
            href="/gabung"
            size="sm"
            className="hidden md:inline-flex"
            aria-label="Daftar menjadi anggota IKMI"
          >
            Daftar Anggota
          </ButtonLink>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface md:hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/ikmi-logo.png"
                alt="Logo IKMI Cirebon"
                width={36}
                height={36}
                className="rounded-full"
              />
              <p className="font-heading text-sm font-extrabold">
                IKMI Cirebon
              </p>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Tutup menu navigasi"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex flex-col gap-1 p-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-semibold text-primary transition-colors hover:bg-background"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="p-4">
            <ButtonLink
              href="/gabung"
              className="w-full"
              onClick={() => setMobileMenuOpen(false)}
            >
              Daftar Anggota
            </ButtonLink>
          </div>
        </div>
      )}
    </nav>
  )
}
