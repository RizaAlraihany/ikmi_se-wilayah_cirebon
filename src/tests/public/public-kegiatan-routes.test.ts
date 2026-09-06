import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('public activity routes', () => {
  it('uses /kegiatan as the canonical Agenda listing and keeps /agenda as a legacy redirect', () => {
    const page = source('src/app/(public)/kegiatan/page.tsx')
    const nextConfig = source('next.config.ts')

    expect(page).toContain("import { AgendaListingPage } from '../agenda/agenda-listing-page'")
    expect(page).toContain("canonical: `${siteUrl}/kegiatan`")
    expect(page).not.toContain('permanentRedirect')
    expect(nextConfig).toContain("source: '/agenda'")
    expect(nextConfig).toContain("source: '/agenda/:path*'")
    expect(nextConfig).toContain("destination: '/kegiatan'")
  })

  it('covers the canonical /kegiatan title, canonical URL, and Open Graph metadata', () => {
    const page = source('src/app/(public)/kegiatan/page.tsx')

    expect(page).toMatch(/title:\s*['"]Kegiatan IKMI Cirebon['"]/,)
    const descriptionMatches = page.match(
      /^\s*description: 'Agenda kegiatan publik IKMI Cirebon yang dijadwalkan\.',\s*$/gm,
    )
    expect(descriptionMatches).toHaveLength(2)
    expect(page).toContain("url: `${siteUrl}/kegiatan`")
    expect(page).toContain("type: 'website'")
    expect(page).toContain('openGraph:')
  })

  it('keeps the legacy /agenda page redirect-only instead of treating it as the canonical SEO source', () => {
    const page = source('src/app/(public)/agenda/page.tsx')

    expect(page).toContain("permanentRedirect('/kegiatan')")
    expect(page).not.toContain('AgendaListingPage')
    expect(page).not.toContain('canonical')
    expect(page).not.toContain('openGraph')
  })

  it('uses modal interaction for the listing and keeps historical Agenda detail URLs redirect-only', () => {
    const listing = source('src/app/(public)/agenda/agenda-listing-page.tsx')
    const interaction = source('src/app/(public)/agenda/agenda-listing-interaction.tsx')
    const legacyDetail = source('src/app/(public)/agenda/[slug]/page.tsx')
    const homepage = source('src/app/(public)/page.tsx')
    const calendar = source('src/app/(public)/_components/calendar-ui.tsx')
    const footer = source('src/app/(public)/_components/public-footer.tsx')

    expect(listing).toContain('AgendaListingInteraction')
    expect(interaction).toContain('aria-haspopup="dialog"')
    expect(interaction).toContain('<Dialog')
    expect(listing).not.toContain('/agenda/')
    expect(homepage).not.toContain('/agenda/${agenda.slug}')
    expect(calendar).not.toContain('/agenda/${event.slug}')
    expect(calendar).toContain('<Link href="/kegiatan">{inner}</Link>')
    expect(footer).toContain("{ label: 'Agenda & Kegiatan', href: '/kegiatan' }")
    expect(legacyDetail).toContain("permanentRedirect('/kegiatan')")
    expect(legacyDetail).not.toContain('generateMetadata')
    expect(existsSync(resolve(process.cwd(), 'src/app/(public)/kegiatan/[slug]/page.tsx'))).toBe(false)
  })

  it('keeps the frozen Program compatibility detail bounded to its public DTO', () => {
    const page = source('src/app/(public)/program/[slug]/page.tsx')
    const query = source('src/features/public/public-program.ts')

    expect(page).toContain('resolveProgramImages(program)')
    expect(page).toContain('program.posts.map')
    expect(page).not.toContain('program.albums')
    expect(page).not.toContain('/galeri/')
    expect(page).toContain('timeZone: \'Asia/Jakarta\'')
    expect(query).toContain("status: 'PUBLISHED'")
    expect(query).not.toContain('albums:')
    expect(query).not.toContain('budgetPlan')
    expect(query).not.toContain('plannedBudget')
  })

})
