import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Facebook, Instagram, MapPin, Music2, Youtube } from 'lucide-react'
import { IKMI_LOGO_URL } from '@/core/brand/assets'

const footerNav = [
  { label: 'Tentang Kami', href: '/tentang-kami' },
  { label: 'Event', href: '/event' },
  { label: 'Struktur', href: '/struktur' },
  { label: 'Blog', href: '/blog' },
]

const socialLinks = [
  { icon: Facebook, label: 'Facebook', href: 'https://www.facebook.com/ikmi.crb' },
  { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/ikmi_crb' },
  { icon: Music2, label: 'TikTok', href: 'https://www.tiktok.com/@ikmi.crb' },
  { icon: Youtube, label: 'YouTube', href: 'https://www.youtube.com/@ikmisewilayahcirebon' },
]

const secretariatMapUrl = 'https://maps.app.goo.gl/uo87mJg9WpV5t6udA'

export function PublicFooter() {
  return (
    <footer
      className="public-footer relative overflow-hidden px-4 py-8 md:px-6 md:py-12 lg:px-8"
      aria-label="Footer"
    >
      {/* Divider gradient */}
      <div className="mx-auto max-w-[1200px] pb-8 md:pb-12">
        <div
          className="h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          }}
        />
      </div>

      <div className="mx-auto grid max-w-[1200px] gap-7 md:grid-cols-3 md:gap-10">
        {/* Kolom 1: Identitas */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-3">
            <Image
              src={IKMI_LOGO_URL}
              alt="Logo IKMI Cirebon"
              width={31}
              height={40}
              className="h-9 w-auto object-contain md:h-10"
            />
            <p className="font-heading text-sm font-extrabold text-surface">
              IKMI Se-Wilayah Cirebon
            </p>
          </div>
          <p className="text-xs leading-6 text-surface/60 md:text-sm md:leading-relaxed">
            Wadah kolaborasi mahasiswa Indramayu di Cirebon untuk berkontribusi bagi kemajuan daerah.
          </p>
        </div>

        {/* Kolom 2: Navigasi Cepat */}
        <div className="space-y-3 md:space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-surface/50 md:text-xs">
            Navigasi Cepat
          </p>
          <nav className="flex flex-col gap-2.5 md:gap-3" aria-label="Navigasi cepat footer">
            {footerNav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-xs font-medium text-surface/70 transition-colors hover:text-surface md:text-sm"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Kolom 3: Sosial + Sekretariat */}
        <div className="space-y-3 md:space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-surface/50 md:text-xs">
            Sosial Media
          </p>
          <div className="flex gap-2.5 md:gap-3">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-all duration-200 hover:scale-110 hover:bg-white/22 hover:text-white md:h-10 md:w-10"
                aria-label={`Ikuti IKMI di ${s.label}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <s.icon className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </div>
          <a
            href={secretariatMapUrl}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-surface/82 transition-colors hover:bg-white/18 hover:text-surface md:text-sm"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buka lokasi sekretariat IKMI Cirebon di Google Maps"
          >
            <MapPin className="h-4 w-4 text-accent" aria-hidden="true" />
            Sekretariat IKMI
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <p className="max-w-xs text-[11px] leading-5 text-surface/50 md:text-xs">
            Buka titik lokasi sekretariat melalui Google Maps.
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="mx-auto mt-8 max-w-[1200px] border-t border-surface/10 pt-5 text-center md:mt-10 md:pt-6">
        <p className="text-[11px] text-surface/40 md:text-xs">
          © 2026 IKMI Se-Wilayah Cirebon. By Departemen Komdigi. All Rights Reserved.
        </p>
      </div>
    </footer>
  )
}
