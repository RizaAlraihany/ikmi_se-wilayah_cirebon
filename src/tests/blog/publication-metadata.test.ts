import { generateMetadata } from '@/app/(public)/publikasi/[category]/[slug]/page'
import { postQueries } from '@/features/blog/queries'

jest.mock('@/features/blog/queries', () => ({
  postQueries: {
    getPublishedPostBySlug: jest.fn(),
    getPublishedPosts: jest.fn(),
  },
}))

const publishedPostMock = jest.mocked(postQueries.getPublishedPostBySlug)

describe('Publication public metadata', () => {
  it('uses SEO fields, a dedicated OG image, canonical URL, and article metadata', async () => {
    publishedPostMock.mockResolvedValueOnce({
      id: 'post-14',
      title: 'Judul Artikel Publik',
      slug: 'judul-artikel-publik',
      content: '<p>Konten publik yang aman.</p>',
      excerpt: 'Ringkasan artikel.',
      thumbnailUrl: 'https://example.test/cover.webp',
      ogImageUrl: 'https://example.test/og.webp',
      seoTitle: 'SEO Title Artikel',
      seoDescription: 'Meta description artikel.',
      seoKeywords: 'ikmi,cirebon',
      publishedAt: new Date('2026-08-12T05:00:00.000Z'),
      updatedAt: new Date('2026-08-12T06:00:00.000Z'),
      category: { name: 'Artikel', slug: 'artikel' },
      author: { name: 'Penulis IKMI', position: null },
    } as never)

    const metadata = await generateMetadata({ params: Promise.resolve({ category: 'artikel', slug: 'judul-artikel-publik' }) })
    expect(metadata).toEqual(expect.objectContaining({
      title: 'SEO Title Artikel',
      description: 'Meta description artikel.',
      alternates: { canonical: '/publikasi/artikel/judul-artikel-publik' },
      openGraph: expect.objectContaining({ type: 'article', images: ['https://example.test/og.webp'] }),
      twitter: expect.objectContaining({ card: 'summary_large_image', images: ['https://example.test/og.webp'] }),
    }))
  })
})
