import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { publicationPath } from '@/features/blog/publication-routes'

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('PUB-001 canonical publication routing', () => {
  it('uses a one-segment canonical URL', () => {
    expect(publicationPath('artikel-ikmi')).toBe('/publikasi/artikel-ikmi')
  })

  it('renders the canonical route and redirects legacy category URLs one-way', () => {
    const route = source('src/app/(public)/publikasi/[...segments]/page.tsx')

    expect(route).toContain('if (segments.length === 2) return permanentRedirect(publicationPath(post.slug))')
    expect(route).toContain('return <PublicationDetail post={post} relatedPosts={relatedPosts} />')
  })

  it('uses canonical paths from public listings, homepage, and sitemap', () => {
    expect(source('src/app/(public)/_components/blog-list.tsx')).toContain('publicationPath(featuredPost.slug)')
    expect(source('src/app/(public)/page.tsx')).toContain('publicationPath(posts[0].slug)')
    expect(source('src/app/sitemap.ts')).toContain('publicationPath(post.slug)')
  })
})
