import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('Tentang page editorial layout', () => {
  const pageSource = readFileSync(
    path.join(process.cwd(), 'src/app/(public)/tentang-kami/page.tsx'),
    'utf8',
  )
  const styles = readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf8')
  const publicBreadcrumbSource = readFileSync(
    path.join(
      process.cwd(),
      'src/app/(public)/_components/public-breadcrumb.tsx',
    ),
    'utf8',
  )

  it('removes the local sub-navigation and keeps the cabinet in the main section flow', () => {
    expect(pageSource).not.toContain('about-v2-nav')
    expect(pageSource).not.toContain('about-page-nav')
    expect(pageSource).toContain('className="about-container about-cabinet-grid"')
    expect(pageSource).toContain(
      'className="about-section about-section--cabinet"',
    )
  })

  it('replaces the About kicker with the shared public breadcrumb', () => {
    expect(pageSource).toContain(
      '<PublicBreadcrumb items={[{ label: "Tentang" }]} tone="inverse" />',
    )
    expect(pageSource).not.toContain(
      '<p className="about-kicker">Tentang IKMI</p>',
    )
    expect(pageSource).not.toContain('about-breadcrumb-band')
    expect(styles).toContain('.public-breadcrumb')
  })

  it('renders every About CTA as an editorial link instead of a button', () => {
    expect(pageSource).not.toContain('ButtonLink')
    expect(pageSource).not.toContain('<button')
    expect(
      pageSource.match(/public-text-link about-(?:action|closing-action)/g),
    ).toHaveLength(5)
  })

  it('uses blue liquid glass for the closing structure CTA panel', () => {
    expect(styles).toContain('.about-closing::before')
    expect(styles).toContain('var(--glass-bg-brand)')
    expect(styles).toContain(
      'backdrop-filter: blur(var(--glass-blur-floating))',
    )
    expect(styles).toContain('saturate(var(--glass-saturate))')
    expect(styles).toContain('.about-closing .about-closing-action')
  })

  it('uses the accessible shared breadcrumb directly or through the shared public-page hero', () => {
    expect(publicBreadcrumbSource).toContain('aria-label="Breadcrumb"')
    expect(publicBreadcrumbSource).toContain('aria-current={isCurrent')
    expect(publicBreadcrumbSource).toContain('<Home aria-hidden="true" />')

    const publicPageHeroSource = readFileSync(
      path.join(process.cwd(), 'src/app/(public)/_components/public-page-hero.tsx'),
      'utf8',
    )
    expect(publicPageHeroSource).toContain('PublicBreadcrumb')

    const heroRoutes = [
      'agenda/agenda-listing-page.tsx',
      'agenda/[slug]/page.tsx',
      'kalender/page.tsx',
      'kirim-tulisan/page.tsx',
      'kirim-tulisan/revisi/[token]/page.tsx',
      'program/page.tsx',
      'program/[slug]/page.tsx',
    ]

    const directBreadcrumbRoutes = [
      'kontak/page.tsx',
      'publikasi/page.tsx',
      'publikasi/publication-detail.tsx',
      'struktur/page.tsx',
      'tentang-kami/page.tsx',
    ]

    for (const route of heroRoutes) {
      const routeSource = readFileSync(
        path.join(process.cwd(), 'src/app/(public)', route),
        'utf8',
      )

      expect(routeSource).toContain('PublicPageHero')
    }

    for (const route of directBreadcrumbRoutes) {
      const routeSource = readFileSync(
        path.join(process.cwd(), 'src/app/(public)', route),
        'utf8',
      )

      expect(routeSource).toContain('PublicBreadcrumb')
    }
  })

  it('uses the five-section order from the approved copywriting document', () => {
    const profileIndex = pageSource.indexOf('id="profil"')
    const historyIndex = pageSource.indexOf('id="sejarah"')
    const cabinetIndex = pageSource.indexOf('id="kabinet"')
    const visionIndex = pageSource.indexOf('id="visi-misi"')
    const officersIndex = pageSource.indexOf('id="pengurus"')

    expect(profileIndex).toBeGreaterThan(-1)
    expect(profileIndex).toBeLessThan(historyIndex)
    expect(historyIndex).toBeLessThan(cabinetIndex)
    expect(cabinetIndex).toBeGreaterThan(-1)
    expect(cabinetIndex).toBeLessThan(visionIndex)
    expect(visionIndex).toBeLessThan(officersIndex)
    expect(pageSource).not.toContain('id="filosofi"')
  })

  it('renders the approved full headings without shortening the copy', () => {
    expect(pageSource).toContain('Rumah Mahasiswa')
    expect(pageSource).toContain('Indramayu di Cirebon')
    expect(pageSource).toContain('Lahir dari Ruang,')
    expect(pageSource).toContain('Tumbuh dalam Perjuangan')
    expect(pageSource).toContain('Satu Arah, Banyak Gerak')
    expect(pageSource).toContain('Dari Gagasan Menjadi Dampak')
    expect(pageSource).toContain('Mereka yang Menjaga Roda Organisasi')
    expect(pageSource).toContain('Berbeda Peran, Satu Tujuan')
  })

  it('keeps headings complete and controls wrapping through responsive type sizes', () => {
    expect(pageSource).toContain('<h1>')
    expect(pageSource).not.toContain('truncate')
    expect(styles).toContain('.about-heading h2')
    expect(styles).toContain('font-size: clamp(1.75rem, 6.8vw, 2.85rem)')
    expect(styles).toContain('font-size: clamp(1.55rem, 6.4vw, 2.1rem)')
  })

  it('keeps cabinet and officer content connected to active public data', () => {
    expect(pageSource).toContain('getActivePublicStructure()')
    expect(pageSource).toContain('cabinet.cabinetName')
    expect(pageSource).toContain('assignments.reduce')
    expect(pageSource).toContain('assignment.person.name')
    expect(pageSource).toContain('assignment.person.photoUrl')
    expect(pageSource).toContain('buildOfficerPreview')
    expect(pageSource).toContain('Data pengurus belum tersedia')
    expect(pageSource).not.toContain('FALLBACK_OFFICER_GROUPS')
  })

  it('uses the zigzag desktop history and four-column direction layouts', () => {
    expect(pageSource).toContain('className="about-history-caption"')
    expect(styles).toContain(
      'grid-template-rows: minmax(6.75rem, 1fr) 1rem minmax(6.75rem, 1fr)',
    )
    expect(styles).toContain(
      '.about-history-step:nth-child(even) .about-media--archive',
    )
    expect(styles).toContain(
      '.about-history-step:nth-child(even) .about-history-caption',
    )
    expect(styles).toContain('grid-template-columns: repeat(5, minmax(0, 1fr))')
    expect(styles).toContain('repeat(3, minmax(0, 1fr))')
    expect(styles).toContain('grid-row: 1 / span 2')
  })
})
