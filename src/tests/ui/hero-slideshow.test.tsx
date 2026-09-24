import { fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { HeroSlideshow } from '@/app/(public)/_components/hero-slideshow'

const slides = [
  {
    id: 'slide-1',
    desktopImage: 'https://res.cloudinary.com/demo/image/upload/slide-1.webp',
    alt: 'Dokumentasi pertama',
  },
  {
    id: 'slide-2',
    desktopImage: 'https://res.cloudinary.com/demo/image/upload/slide-2.webp',
    alt: 'Dokumentasi kedua',
  },
]

const heroProps = {
  eyebrow: 'IKMI Cirebon',
  title: 'Rumah Kedua Mahasiswa Indramayu',
  description: 'Ruang bertumbuh untuk mahasiswa Indramayu di Cirebon.',
  motto: 'Memayu Ing Jagat',
  primaryCta: { label: 'Lihat agenda', href: '#agenda-bulan-ini' },
  secondaryCta: { label: 'Kenal IKMI', href: '/tentang-kami' },
}

describe('HeroSlideshow', () => {
  it('renders complete editorial identity, actions, and every documentary image', () => {
    render(<HeroSlideshow slides={slides} {...heroProps} />)

    expect(screen.getByRole('heading', { name: heroProps.title })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: heroProps.primaryCta.label })).toHaveAttribute('href', '#agenda-bulan-ini')
    expect(screen.getByRole('link', { name: heroProps.secondaryCta.label })).toHaveAttribute('href', '/tentang-kami')
    expect(screen.getByAltText('Dokumentasi pertama')).toBeInTheDocument()
    expect(screen.getByAltText('Dokumentasi kedua')).toBeInTheDocument()
  })

  it('changes the active photo from mobile and desktop controls', () => {
    render(<HeroSlideshow slides={slides} {...heroProps} />)
    const images = screen.getAllByRole('img')

    expect(images[0]).toHaveClass('is-active')
    fireEvent.click(screen.getAllByRole('button', { name: 'Foto berikutnya' })[0])
    expect(images[1]).toHaveClass('is-active')
    fireEvent.click(screen.getAllByRole('button', { name: 'Foto sebelumnya' })[1])
    expect(images[0]).toHaveClass('is-active')
  })

  it('omits slider controls when only one photo exists', () => {
    render(<HeroSlideshow slides={slides.slice(0, 1)} {...heroProps} />)
    expect(screen.queryByRole('button', { name: 'Foto berikutnya' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Foto sebelumnya' })).not.toBeInTheDocument()
  })

  it('keeps stacked mobile and legacy desktop hero layouts without heading truncation', () => {
    const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')
    expect(css).toContain('flex-direction: column')
    expect(css).toContain('inset: 0 0 0 35%')
    expect(css).toContain('.home-hero-mobile-controls')
    expect(css).toContain('.home-hero-desktop-controls')
    expect(css).toContain('-webkit-line-clamp: initial !important')
  })
})
