import { render, screen } from '@testing-library/react'
import { PublicationDetail } from '@/app/(public)/publikasi/publication-detail'

jest.mock('@/app/(public)/publikasi/article-share-button', () => ({ ArticleActionButtons: () => null }))

it('renders the imported excerpt as inert readable text and preserves the complete article title', () => {
  const post = {
    id: 'article', slug: 'tradisi-ngarot', title: 'Tradisi Ngarot dan Gotong Royong Masyarakat Indramayu',
    excerpt: '&nbsp;Warna-warni <b>busana adat</b> &amp; doa bersama.', content: '<p>Isi artikel yang lengkap.</p>',
    publishedAt: new Date('2026-09-01'), updatedAt: new Date('2026-09-01'),
    author: { name: 'Redaksi', position: null }, category: { name: 'Artikel', slug: 'artikel' },
  } as Parameters<typeof PublicationDetail>[0]['post']
  const { container } = render(<PublicationDetail post={post} relatedPosts={[]} />)
  expect(screen.getByText('Warna-warni busana adat & doa bersama.')).toBeInTheDocument()
  expect(screen.queryByText(/&nbsp;/)).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(post.title)
  const structuredData = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!)
  expect(structuredData['@graph'][0].description).toBe('Warna-warni busana adat & doa bersama.')
})
