import { readFileSync } from 'node:fs'
import path from 'node:path'

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

describe('Contact and homepage FAQ editorial presentation', () => {
  const contactSource = readSource('src/app/(public)/kontak/page.tsx')
  const footerSource = readSource('src/app/(public)/_components/public-footer.tsx')
  const homeSource = readSource('src/app/(public)/page.tsx')
  const webConfigSource = readSource('src/features/web-config/queries.ts')
  const styles = readSource('src/app/globals.css')

  it('keeps contact content compact, accessible, and configuration-backed', () => {
    expect(contactSource).toContain('className="contact-official-link"')
    expect(contactSource).toContain('className="contact-message-list"')
    expect(contactSource).toContain('aria-label="Panduan mengirim pesan"')
    expect(contactSource).toContain('getPublicContactInfo')
    expect(contactSource).toContain('Kontak resmi sedang diperbarui.')
    expect(footerSource).toContain('getPublicContactInfo')
    expect(footerSource).toContain('Kontak resmi belum dikonfigurasi.')
    expect(webConfigSource).toContain('async getPublicContactInfo()')
    expect(contactSource).not.toContain('padStart')
    expect(contactSource).not.toContain('public-glass-card')
    expect(contactSource).not.toContain('destinationNumber')
    expect(styles).toContain('.contact-correspondence-scope')
  })

  it('uses the reference FAQ copy and native disclosures without static contact identities', () => {
    expect(homeSource).toContain('Sering Ditanyakan (FAQ)')
    expect(homeSource).toContain('Apa itu IKMI Se-Wilayah Cirebon?')
    expect(homeSource).toContain('Apa itu PRABUMI?')
    expect(homeSource).toContain('Gunakan halaman Kontak untuk melihat kanal resmi organisasi')
    expect(homeSource).toContain('className="home-faq-item-icon"')
    expect(homeSource).not.toContain('open={index === 0}')
    expect(styles).toContain('#view-beranda .home-faq-list')
    expect(styles).toContain('grid-template-columns: 1.6rem minmax(0, 1fr) auto')
  })

  it('keeps complete public headings compact through responsive type sizes', () => {
    expect(styles).toContain('.public-shell main :is(h1, h2, h3)')
    expect(styles).toContain('max-width: 100% !important')
    expect(styles).toContain('overflow: visible')
    expect(styles).toContain('overflow-wrap: normal')
    expect(styles).toContain('font-size: clamp(1.5rem, 5.8vw, 3rem) !important')
    expect(styles).toContain('font-size: clamp(1.25rem, 4.6vw, 2rem) !important')
    expect(styles).toContain('font-size: clamp(1rem, 3.6vw, 1.25rem) !important')

    const typographyAuthority = styles.slice(styles.indexOf('/* Public typography authority'))
    expect(typographyAuthority).not.toContain('line-clamp')
  })
})
