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

  it('changes the active photo from mobile controls and desktop indicator dots', () => {
    render(<HeroSlideshow slides={slides} {...heroProps} />)
    const images = screen.getAllByRole('img')

    expect(images[0]).toHaveClass('is-active')
    fireEvent.click(screen.getByRole('button', { name: 'Foto berikutnya' }))
    expect(images[1]).toHaveClass('is-active')
    fireEvent.click(screen.getByRole('button', { name: 'Foto sebelumnya' }))
    expect(images[0]).toHaveClass('is-active')
    fireEvent.click(screen.getByRole('button', { name: 'Foto 2' }))
    expect(images[1]).toHaveClass('is-active')
  })

  it('omits slider controls when only one photo exists', () => {
    render(<HeroSlideshow slides={slides.slice(0, 1)} {...heroProps} />)
    expect(screen.queryByRole('button', { name: 'Foto berikutnya' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Foto sebelumnya' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Foto 1' })).not.toBeInTheDocument()
  })

  it('keeps stacked mobile and legacy desktop hero layouts without heading truncation', () => {
    const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')
    expect(css).toContain('flex-direction: column')
    expect(css).toContain('inset: 0 0 0 35%')
    expect(css).toContain('.home-hero-mobile-controls')
    expect(css).toContain('.home-hero-desktop-controls')
    expect(css).toContain('-webkit-line-clamp: initial !important')
  })

  it('renders separated floating quick access badges and infinite marquee band', () => {
    const floatingBadges = [
      { id: 'agenda', label: 'Agenda Kegiatan', description: 'Jadwal terdekat', href: '/kegiatan', icon: 'agenda' as const },
      { id: 'join', label: 'Gabung IKMI', description: 'Pendaftaran anggota', href: '/gabung', icon: 'join' as const },
      { id: 'publication', label: 'Publikasi', description: 'Karya ilmiah', href: '/publikasi', icon: 'publication' as const },
    ]
    const departmentLogos = [
      'https://res.cloudinary.com/dsgldeuuy/image/upload/v1781210303/bph_n4damh.png',
      'https://res.cloudinary.com/dsgldeuuy/image/upload/v1781210299/kaderisasi_sfv6xl.png',
    ]

    render(
      <HeroSlideshow
        slides={slides}
        {...heroProps}
        floatingBadges={floatingBadges}
        departmentLogos={departmentLogos}
      />
    )

    // Floating badges rendered as separate links
    expect(screen.getByRole('link', { name: /Agenda Kegiatan/i })).toHaveAttribute('href', '/kegiatan')
    expect(screen.getByRole('link', { name: /Gabung IKMI/i })).toHaveAttribute('href', '/gabung')
    expect(screen.getByRole('link', { name: /Publikasi/i })).toHaveAttribute('href', '/publikasi')

    // Infinite logo marquee band rendered with department logos (logos only)
    expect(screen.getAllByAltText(/Logo Departemen IKMI Cirebon/i).length).toBeGreaterThanOrEqual(1)
  })
})

