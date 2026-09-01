import { fireEvent, render, screen } from '@testing-library/react'
import { BlogList } from '@/app/(public)/_components/blog-list'

const posts = [
  {
    id: 'post-1',
    slug: 'berita-utama',
    title: 'Berita Utama IKMI',
    content: '<p>Rangkuman berita organisasi.</p>',
    thumbnailUrl: null,
    publishedAt: new Date('2026-08-20T00:00:00.000Z'),
    author: { name: 'Redaksi IKMI', position: null },
    category: { slug: 'berita', name: 'Berita' },
  },
  {
    id: 'post-2',
    slug: 'opini-terbaru',
    title: 'Opini Terbaru Anggota',
    content: '<p>Gagasan dari anggota IKMI.</p>',
    thumbnailUrl: null,
    publishedAt: new Date('2026-08-19T00:00:00.000Z'),
    author: { name: 'Penulis IKMI', position: null },
    category: { slug: 'opini', name: 'Opini' },
  },
] as const

describe('BlogList', () => {
  it('uses clear pressed states for category filters and filters publication content', () => {
    render(<BlogList initialPosts={[...posts]} />)

    const filters = screen.getByRole('group', { name: 'Filter publikasi' })
    const categorySelect = screen.getByRole('combobox', { name: 'Filter kategori publikasi' })
    const allButton = screen.getByRole('button', { name: 'Semua' })
    const opinionButton = screen.getByRole('button', { name: 'Opini' })

    expect(filters).toBeInTheDocument()
    expect(categorySelect).toHaveValue('Semua')
    expect(allButton).toHaveAttribute('aria-pressed', 'true')

    fireEvent.change(categorySelect, { target: { value: 'Opini' } })

    expect(categorySelect).toHaveValue('Opini')
    expect(opinionButton).toHaveAttribute('aria-pressed', 'true')
    expect(allButton).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Opini Terbaru Anggota')).toBeInTheDocument()
    expect(screen.queryByText('Berita Utama IKMI')).not.toBeInTheDocument()
    expect(screen.queryByText('Publikasi Lainnya')).not.toBeInTheDocument()
  })

  it('filters results by a search query', () => {
    render(<BlogList initialPosts={[...posts]} />)

    expect(screen.getByRole('searchbox')).toHaveAccessibleName('Cari dalam arsip')

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'anggota' },
    })

    expect(screen.getByText('Opini Terbaru Anggota')).toBeInTheDocument()
    expect(screen.queryByText('Berita Utama IKMI')).not.toBeInTheDocument()
  })

  it('marks featured and archive headings for the two-line card-title limit', () => {
    render(<BlogList initialPosts={[...posts]} />)

    expect(screen.getByRole('heading', { name: 'Berita Utama IKMI' })).toHaveClass('publication-card-title')
    expect(screen.getByRole('heading', { name: 'Opini Terbaru Anggota' })).toHaveClass('publication-card-title')
    expect(screen.getByRole('link', { name: /Berita Utama IKMI/i })).toHaveAttribute('href', '/publikasi/berita-utama')
  })
})
