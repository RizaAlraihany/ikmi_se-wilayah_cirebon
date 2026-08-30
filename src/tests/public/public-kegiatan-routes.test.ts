import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('legacy public activity route', () => {
  it('redirects the retired aggregate route to the homepage', () => {
    const page = source('src/app/(public)/kegiatan/page.tsx')
    const nextConfig = source('next.config.ts')

    expect(page).toContain("permanentRedirect('/')")
    expect(page).toContain("from 'next/navigation'")
    expect(nextConfig).toContain("source: '/kegiatan'")
    expect(nextConfig).toContain("destination: '/'")
  })

  it('renders Program cover and only related public content supplied by the public DTO', () => {
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

  it('declares canonical and Open Graph metadata on the active listing routes', () => {
    for (const path of [
      'src/app/(public)/program/page.tsx',
      'src/app/(public)/agenda/page.tsx',
    ]) {
      const page = source(path)
      expect(page).toContain('alternates: { canonical:')
      expect(page).toContain('openGraph:')
    }
  })
})
