import { fireEvent, render, screen } from '@testing-library/react'
import { HeroSlideshow } from '@/app/(public)/_components/hero-slideshow'

const slides = [
  {
    id: 'slide-1',
    desktopImage: 'https://res.cloudinary.com/demo/image/upload/slide-1.webp',
  },
  {
    id: 'slide-2',
    desktopImage: 'https://res.cloudinary.com/demo/image/upload/slide-2.webp',
  },
]

describe('HeroSlideshow', () => {
  const heroProps = {
    eyebrow: 'IKMI Cirebon',
    title: 'Rumah Kedua Mahasiswa Indramayu',
    description: 'Ruang bertumbuh untuk mahasiswa Indramayu di Cirebon.',
    motto: 'Memayu Ing Jagat',
    primaryCta: { label: 'Lihat agenda', href: '#agenda-bulan-ini' },
    secondaryCta: { label: 'Kenal IKMI', href: '/tentang-kami' },
  }

  it('renders the editorial identity and its two actions', () => {
    render(<HeroSlideshow slides={slides} {...heroProps} />)

    expect(screen.getByRole('heading', { name: heroProps.title })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: heroProps.primaryCta.label })).toHaveAttribute('href', '#agenda-bulan-ini')
    expect(screen.getByRole('link', { name: heroProps.secondaryCta.label })).toHaveAttribute('href', '/tentang-kami')
  })

  it('lets visitors select a documentary photo', () => {
    render(<HeroSlideshow slides={slides} {...heroProps} />)

    const secondPhoto = screen.getByRole('button', { name: 'Tampilkan foto 2' })
    fireEvent.click(secondPhoto)

    expect(secondPhoto).toHaveAttribute('aria-pressed', 'true')
  })
})
