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
  { label: 'Aduan Publik', href: '/aduan' },
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
      className="bg-primary px-4 py-12 md:px-6 lg:px-8"
      aria-label="Footer"
    >
      {/* Divider */}
      <div className="mx-auto max-w-[1200px] border-t border-surface/10 pb-12" />

      <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-2 lg:grid-cols-4">
        {/* Kolom 1: Identitas */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Image
              src="/ikmi-logo.png"
              alt="Logo IKMI Cirebon"
              width={36}
              height={36}
              className="rounded-full"
            />
            <p className="font-heading text-sm font-extrabold text-surface">
              IKMI Cirebon
            </p>
          </div>
          <p className="text-sm leading-relaxed text-surface/60">
            Wadah kolaborasi mahasiswa Indramayu di Cirebon untuk berkontribusi bagi kemajuan daerah.
          </p>
        </div>

        {/* Kolom 2: Navigasi Cepat */}
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-surface/50">
            Navigasi Cepat
          </p>
          <nav className="flex flex-col gap-3" aria-label="Navigasi cepat footer">
            {footerNav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-surface/70 transition-colors hover:text-surface"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Kolom 3: Kontak */}
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-surface/50">
            Kontak
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-surface">Komdigi IKMI</p>
                <p className="text-xs text-surface/60">{contact.whatsapp}</p>
                <p className="text-xs text-surface/60">{contact.email}</p>
                <p className="text-xs text-surface/60">{contact.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom 4: Sosmed + QR */}
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-surface/50">
            Sosial Media
          </p>
          <div className="flex gap-3">
            {sosmed.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/10 text-surface/70 transition-colors hover:bg-surface/20 hover:text-surface"
                aria-label={`Ikuti IKMI di ${s.label}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <s.icon className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </div>
          {/* QR placeholder */}
          <div className="mt-2 flex flex-col items-start gap-2">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface/10"
              aria-label="QR Code pendaftaran anggota"
            >
              <QrCode className="h-8 w-8 text-surface/50" aria-hidden="true" />
            </div>
            <p className="text-xs text-surface/50">Scan untuk daftar</p>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="mx-auto mt-10 max-w-[1200px] border-t border-surface/10 pt-6 text-center">
        <p className="text-xs text-surface/40">
          © 2026 IKMI Se-Wilayah Cirebon. By Departemen Komdigi. All Rights Reserved.
        </p>
      </div>
    </footer>
  )
}
