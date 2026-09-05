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

  it('uses the current FAQ copy and native disclosures without static contact identities', () => {
    expect(homeSource).toContain('Pertanyaan yang Sering Ditanyakan')
    expect(homeSource).toContain('Apa itu IKMI Se-Wilayah Cirebon?')
    expect(homeSource).toContain('Apa itu PRABUMI?')
    expect(homeSource).toContain('Gunakan halaman Kontak untuk melihat kanal resmi organisasi')
    expect(homeSource).toContain('className="hm-faq-open-grid"')
    expect(homeSource).toContain('className="hm-faq-rubric-item"')
    expect(homeSource).not.toContain('open={index === 0}')
    expect(styles).toContain('.hm-faq-open-grid')
    expect(styles).toContain('.hm-faq-rubric-item summary')
    expect(styles).toContain('grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)')
  })

  it('keeps complete public headings compact through responsive type sizes', () => {
    expect(styles).toContain('.public-shell main :is(h1, h2, h3)')
    expect(styles).toMatch(/max-width:\s*100%/)
    expect(styles).toMatch(/overflow:\s*visible/)
    expect(styles).toMatch(/overflow-wrap:\s*normal/)
    expect(styles).toContain('font-size: clamp(1.5rem, 5.8vw, 3rem)')
    expect(styles).toContain('font-size: clamp(1.25rem, 4.6vw, 2rem)')
    expect(styles).toContain('font-size: clamp(1rem, 3.6vw, 1.25rem)')

    const typographyAuthority = styles.slice(styles.indexOf('/* Public typography authority'))
    expect(typographyAuthority).not.toContain('line-clamp')
  })
})
