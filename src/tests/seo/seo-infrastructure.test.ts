/**
 * Phase 20 — SEO Infrastructure Tests
 *
 * Verifies that:
 * - robots.ts disallows private routes
 * - All public pages have canonical metadata
 * - Dashboard layout has noindex
 * - Login page has noindex
 * - Request Pamflet has noindex
 * - Kirim Tulisan revisi routes have noindex
 * - Structured data helpers produce valid JSON-LD
 * - Sitemap includes dynamic routes
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { breadcrumbStructuredData, serializeStructuredData } from '../../core/seo/structured-data'

function readSource(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('Phase 20 — SEO Infrastructure', () => {
  describe('robots.ts', () => {
    it('disallows admin and dashboard routes', () => {
      const source = readSource('src/app/robots.ts')
      expect(source).toContain('/admin')
      expect(source).toContain('/dashboard/')
      expect(source).toContain('/login')
    })

    it('disallows request-pamflet subdomain paths', () => {
      const source = readSource('src/app/robots.ts')
      expect(source).toContain('/request-pamflet')
    })

    it('disallows api routes', () => {
      const source = readSource('src/app/robots.ts')
      expect(source).toContain('/api/')
    })

    it('disallows kirim-tulisan revision token routes', () => {
      const source = readSource('src/app/robots.ts')
      expect(source).toContain('/kirim-tulisan/revisi/')
    })

    it('references sitemap.xml', () => {
      const source = readSource('src/app/robots.ts')
      expect(source).toContain('sitemap.xml')
    })

    it('does not block Next.js assets required to render public pages', () => {
      const source = readSource('src/app/robots.ts')
      expect(source).not.toContain('/_next/static/')
      expect(source).not.toContain('/_next/image/')
    })
  })

  describe('noindex — private pages', () => {
    it('login page has noindex', () => {
      const source = readSource('src/app/(auth)/login/page.tsx')
      expect(source).toContain('index: false')
    })

    it('dashboard layout has noindex', () => {
      const source = readSource('src/app/(dashboard)/layout.tsx')
      expect(source).toContain('index: false')
    })

    it('request pamflet page has noindex', () => {
      const source = readSource('src/app/request-pamflet/page.tsx')
      expect(source).toContain('index: false')
    })

    it('kirim-tulisan submission page has noindex', () => {
      const source = readSource('src/app/(public)/kirim-tulisan/page.tsx')
      expect(source).toContain('index: false')
    })
  })

  describe('canonical — public pages', () => {
    const publicPages = [
      ['Kegiatan List', 'src/app/(public)/kegiatan/page.tsx'],
      ['Publikasi List', 'src/app/(public)/publikasi/page.tsx'],
      ['Kontak', 'src/app/(public)/kontak/page.tsx'],
      ['Struktur', 'src/app/(public)/struktur/page.tsx'],
    ] as const

    for (const [name, path] of publicPages) {
      it(`${name} page has canonical URL`, () => {
        const source = readSource(path)
        expect(source).toMatch(/canonical/i)
      })
    }

    it('keeps /tentang as the v5 entry while reusing the preserved implementation metadata', () => {
      const route = readSource('src/app/(public)/tentang/page.tsx')
      const implementation = readSource('src/app/(public)/tentang-kami/page.tsx')

      expect(route).toContain('export { default, metadata }')
      expect(implementation).toContain('canonical')
      expect(implementation).toContain('/tentang')
    })

    it('Program detail page has generateMetadata with canonical', () => {
      const source = readSource('src/app/(public)/program/[slug]/page.tsx')
      expect(source).toContain('generateMetadata')
      expect(source).toContain('canonical')
    })

    it('Publication article page has generateMetadata with canonical', () => {
      const source = readSource('src/app/(public)/publikasi/[...segments]/page.tsx')
      expect(source).toContain('generateMetadata')
      expect(source).toContain('canonical')
      expect(source).toContain('publicationPath(post.slug)')
    })

    it('Agenda detail has generateMetadata with canonical', () => {
      const source = readSource('src/app/(public)/agenda/[slug]/page.tsx')
      expect(source).toContain('generateMetadata')
      expect(source).toContain('canonical')
    })
  })

  describe('sitemap.ts', () => {
    it('includes static public routes', () => {
      const source = readSource('src/app/sitemap.ts')
      expect(source).toContain('/tentang')
      expect(source).toContain('/kegiatan')
      expect(source).toContain('/publikasi')
      expect(source).not.toContain('/tentang-kami')
      expect(source).not.toContain('/program')
      expect(source).not.toContain('/agenda')
      expect(source).not.toContain('/kalender')
      expect(source).not.toContain('/galeri')
      expect(source).toContain('/gabung')
      expect(source).toContain('/kontak')
    })

    it('includes canonical dynamic Publication URLs without legacy category paths', () => {
      const source = readSource('src/app/sitemap.ts')
      expect(source).toContain('prisma.post.findMany')
      expect(source).toContain('publicationPath(post.slug)')
      expect(source).not.toContain('post.category.slug')
      expect(source).not.toContain('prisma.program.findMany')
      expect(source).not.toContain('prisma.agenda.findMany')
      expect(source).not.toContain('prisma.album.findMany')
    })

    it('does not promote frozen Program or Agenda detail routes', () => {
      const source = readSource('src/app/sitemap.ts')
      expect(source).not.toContain('prisma.program.findMany')
      expect(source).not.toContain('prisma.agenda.findMany')
    })

    it('filters only PUBLISHED posts in sitemap', () => {
      const source = readSource('src/app/sitemap.ts')
      expect(source).toContain('PostStatus.PUBLISHED')
    })
  })

  describe('structured data', () => {
    it('root layout has Organization JSON-LD', () => {
      const source = readSource('src/app/layout.tsx')
      expect(source).toContain('@type')
      expect(source).toContain('Organization')
      expect(source).toContain('application/ld+json')
    })

    it('article detail has Article JSON-LD', () => {
      const source = readSource('src/app/(public)/publikasi/publication-detail.tsx')
      expect(source).toContain("'@type': 'Article'")
      expect(source).toContain('application/ld+json')
      expect(source).toContain('publicationPath(post.slug)')
    })

    it('program detail has BreadcrumbList JSON-LD', () => {
      const source = readSource('src/app/(public)/program/[slug]/page.tsx')
      expect(source).toContain('breadcrumbStructuredData')
      expect(source).toContain('application/ld+json')
    })

    it('frozen Agenda detail retains breadcrumb data without legacy Event JSON-LD', () => {
      const source = readSource('src/app/(public)/agenda/[slug]/page.tsx')
      expect(source).toContain('breadcrumbStructuredData')
      expect(source).not.toContain("'@type': 'Event'")
    })

    it('breadcrumbStructuredData serializes without XSS chars', () => {
      const items = [{ name: 'Home', path: '/' }, { name: 'Program', path: '/program' }]
      const data = breadcrumbStructuredData(items)
      expect(data['@type']).toBe('BreadcrumbList')
      expect(data.itemListElement).toHaveLength(2)
      expect(data.itemListElement[0].position).toBe(1)

      const serialized = serializeStructuredData({ '<script>': '&test' })
      expect(serialized).not.toContain('<script>')
      expect(serialized).not.toContain('&test')
      expect(serialized).toContain('\\u003c')
    })
  })

  describe('OG metadata', () => {
    it('root layout has og:type website and og:title', () => {
      const source = readSource('src/app/layout.tsx')
      expect(source).toContain('openGraph')
      expect(source).toContain('type: "website"')
    })

    it('publication article has og:type article', () => {
      const source = readSource('src/app/(public)/publikasi/[...segments]/page.tsx')
      expect(source).toContain("type: 'article'")
    })
  })

  describe('clean public URLs', () => {
    it('program detail uses slug-based URL not raw ID', () => {
      const source = readSource('src/app/(public)/program/[slug]/page.tsx')
      expect(source).toContain('/program/')
      expect(source).not.toContain('/program?id=')
    })

    it('legacy structure URL redirects permanently to its canonical route', () => {
      const source = readSource('src/app/(public)/tentang/struktur/page.tsx')
      expect(source).toContain('permanentRedirect')
      expect(source).toContain('/struktur')
    })

    it('legacy Event URLs redirect permanently to the v5 Kegiatan list', () => {
      const source = readSource('next.config.ts')
      expect(source).toContain('/event')
      expect(source).toContain('/event/:path*')
      expect(source).toContain('/kegiatan')
      expect(source).toContain('permanent: true')
    })
  })

  describe('security header configuration', () => {
    it('next.config.ts includes X-Frame-Options DENY', () => {
      const source = readSource('next.config.ts')
      expect(source).toContain('X-Frame-Options')
      expect(source).toContain('DENY')
    })

    it('next.config.ts includes X-Content-Type-Options nosniff', () => {
      const source = readSource('next.config.ts')
      expect(source).toContain('X-Content-Type-Options')
      expect(source).toContain('nosniff')
    })

    it('next.config.ts includes Referrer-Policy', () => {
      const source = readSource('next.config.ts')
      expect(source).toContain('Referrer-Policy')
    })

    it('next.config.ts includes Strict-Transport-Security (HSTS)', () => {
      const source = readSource('next.config.ts')
      expect(source).toContain('Strict-Transport-Security')
      expect(source).toContain('max-age=')
    })
  })
})
