import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowUpRight,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Youtube,
} from 'lucide-react'
import { IKMI_LOGO_URL } from '@/core/brand/assets'
import { webConfigQueries } from '@/features/web-config/queries'

const explorationLinks = [
  { label: 'Tentang IKMI', href: '/tentang-kami' },
  { label: 'Agenda & Kegiatan', href: '/kegiatan' },
  { label: 'Publikasi Terbaru', href: '/publikasi' },
  { label: 'Hubungi Kami', href: '/kontak' },
  { label: 'Pendaftaran Anggota', href: '/gabung' },
]

function asExternalUrl(value: string | null) {
  if (!value) return null

  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

function asWhatsAppUrl(value: string | null) {
  const number = value?.replace(/\D/g, '')
  return number && number.length >= 8 && number.length <= 15 ? `https://wa.me/${number}` : null
}

export async function PublicFooter() {
  const contact = await webConfigQueries.getPublicContactInfo()
  const whatsappUrl = asWhatsAppUrl(contact.whatsapp)
  const addressMapUrl = contact.address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(contact.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : null
  const addressRouteUrl = contact.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`
    : null
  const socialLinks = [
    { label: 'Facebook', href: null, icon: Facebook },
    { label: 'Instagram', href: asExternalUrl(contact.instagram), icon: Instagram },
    { label: 'TikTok', href: asExternalUrl(contact.tiktok), icon: Music2 },
    { label: 'YouTube', href: asExternalUrl(contact.youtube), icon: Youtube },
  ].filter((link): link is { label: string; href: string; icon: typeof Facebook } => Boolean(link.href))

  return (
    <footer className="public-footer-root" aria-label="Footer">
      <div className="public-container public-footer-inner">
        <div className="public-footer-grid">
          <div className="public-footer-brand">
            <div className="public-footer-logo-row">
              <Image
                src={IKMI_LOGO_URL}
                alt="Logo IKMI Cirebon"
                width={36}
                height={45}
                className="h-10 w-auto shrink-0"
              />
              <div>
                <p className="public-footer-brand-title">IKMI SE-WILAYAH CIREBON</p>
                <p className="public-footer-motto">“Memayu Ing Jagat”</p>
              </div>
            </div>
            <p className="public-footer-brand-desc">
              Ikatan Keluarga Mahasiswa Indramayu (IKMI) Se-Wilayah Cirebon adalah organisasi kedaerahan yang berfungsi sebagai wadah silaturahmi, ruang pengembangan intelektual, dan jembatan pengabdian bagi mahasiswa Indramayu di perantauan.
            </p>
          </div>

          <nav className="public-footer-nav" aria-label="Eksplorasi">
            <p className="public-footer-heading">Eksplorasi</p>
            <ul className="public-footer-links">
              {explorationLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="public-footer-link group">
                    <span>{item.label}</span>
                    <ArrowUpRight
                      className="h-3.5 w-3.5 shrink-0 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="public-footer-contact">
            <p className="public-footer-heading">Hubungi Kami</p>
            <div className="public-footer-contact-list">
              <div className="public-footer-contact-item">
                <span className="public-footer-contact-type">Email</span>
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="public-footer-contact-link">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                    <span>{contact.email}</span>
                  </a>
                ) : (
                  <span className="public-footer-contact-hint">Kontak resmi belum dikonfigurasi.</span>
                )}
              </div>

              {whatsappUrl ? (
                <div className="public-footer-contact-item">
                  <span className="public-footer-contact-type">WhatsApp</span>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="public-footer-contact-link"
                  >
                    <MessageCircle className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                    <span>{contact.whatsapp}</span>
                  </a>
                </div>
              ) : null}
            </div>

            <div className="public-footer-social">
              <p className="public-footer-subheading">Media Sosial</p>
              {socialLinks.length ? (
                <div className="public-footer-social-icons">
                  {socialLinks.map(({ label, href, icon: Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="public-footer-social-btn"
                      aria-label={label}
                      title={label}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="public-footer-contact-hint">Belum dikonfigurasi.</p>
              )}
            </div>
          </div>

          <div className="public-footer-location">
            <p className="public-footer-heading">Sekretariat</p>
            <div className="public-footer-address-block">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <p className="public-footer-address-detail">
                {contact.address ?? 'Alamat sekretariat belum dikonfigurasi.'}
              </p>
            </div>

            {addressMapUrl && addressRouteUrl ? (
              <div className="public-footer-map-card">
                <iframe
                  src={addressMapUrl}
                  title="Peta lokasi sekretariat"
                  className="public-footer-map-iframe"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <a
                  href={addressRouteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="public-footer-map-action"
                >
                  <span>Buka Rute di Google Maps</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            ) : null}
          </div>
        </div>

        <div className="public-footer-bottom">
          <p className="public-footer-copyright">
            © 2026 Departemen Komdigi Ikatan Keluarga Mahasiswa Indramayu Se-Wilayah Cirebon. All Rights Reserved.
          </p>
          <div className="public-footer-bottom-meta">
            <span>Cirebon &amp; Indramayu, Jawa Barat</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
