import Image from 'next/image'
import Link from 'next/link'
import { Phone, QrCode, Facebook, Instagram, Youtube } from 'lucide-react'
import { webConfigQueries } from '@/features/web-config/queries'
import { defaultWebConfig } from '@/features/web-config/default-config'

const footerNav = [
  { label: 'Tentang Kami', href: '/tentang-kami' },
  { label: 'Event', href: '/event' },
  { label: 'Struktur', href: '/struktur' },
  { label: 'Blog', href: '/blog' },
]

async function getContactInfo() {
  const config = await webConfigQueries.getWebConfigByKey('contact_info')
  if (!config) return defaultWebConfig.contact_info
  try {
    return { ...defaultWebConfig.contact_info, ...JSON.parse(config.valueJson) }
  } catch {
    return defaultWebConfig.contact_info
  }
}

export async function PublicFooter() {
  const contact = await getContactInfo()
  const sosmed = [
    { icon: Instagram, label: 'Instagram', href: contact.instagram },
    { icon: Facebook, label: 'TikTok', href: contact.tiktok },
    { icon: Youtube, label: 'YouTube', href: contact.youtube },
  ].filter((item) => item.href)

  return (
    <footer
      className="px-4 py-8 md:px-6 md:py-12 lg:px-8"
      style={{ background: 'linear-gradient(180deg, #001769 0%, #012580 100%)' }}
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

      <div className="mx-auto grid max-w-[1200px] gap-7 md:grid-cols-2 md:gap-10 lg:grid-cols-4">
        {/* Kolom 1: Identitas */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-3">
            <Image
              src="/ikmi-logo.png"
              alt="Logo IKMI Cirebon"
              width={34}
              height={34}
              className="h-[34px] w-[34px] rounded-full md:h-9 md:w-9"
            />
            <p className="font-heading text-sm font-extrabold text-surface">
              IKMI Cirebon
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

        {/* Kolom 3: Kontak */}
        <div className="space-y-3 md:space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-surface/50 md:text-xs">
            Kontak
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-surface">Komdigi IKMI</p>
                <p className="text-[11px] text-surface/60 md:text-xs">{contact.whatsapp}</p>
                <p className="text-[11px] text-surface/60 md:text-xs">{contact.email}</p>
                <p className="text-[11px] text-surface/60 md:text-xs">{contact.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom 4: Sosmed + QR */}
        <div className="space-y-3 md:space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-surface/50 md:text-xs">
            Sosial Media
          </p>
          <div className="flex gap-2.5 md:gap-3">
            {sosmed.map((s) => (
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
          {/* QR placeholder */}
          <div className="mt-1 flex flex-col items-start gap-2 md:mt-2">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface/10 md:h-16 md:w-16"
              aria-label="QR Code pendaftaran anggota"
            >
              <QrCode className="h-7 w-7 text-surface/50 md:h-8 md:w-8" aria-hidden="true" />
            </div>
            <p className="text-[11px] text-surface/50 md:text-xs">Scan untuk daftar</p>
          </div>
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
