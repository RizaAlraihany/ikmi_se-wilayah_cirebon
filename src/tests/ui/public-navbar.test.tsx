import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PublicNavbar } from '@/app/(public)/_components/public-navbar'

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('PublicNavbar', () => {
  it('marks the current page and keeps top-level navigation backgrounds transparent', () => {
    const { container } = render(<PublicNavbar />)
    const desktopHome = container.querySelector<HTMLAnchorElement>('nav[aria-label="Navigasi utama"] a[href="/"]')
    const mobileHome = container.querySelector<HTMLAnchorElement>('nav[aria-label="Navigasi mobile"] a[href="/"]')

    expect(desktopHome).toHaveAttribute('aria-current', 'page')
    expect(mobileHome).toHaveAttribute('aria-current', 'page')
    expect(desktopHome).not.toHaveClass('hover:bg-white/5')
    expect(screen.getByRole('navigation', { name: 'Navigasi utama' })).toBeInTheDocument()
  })

  it('switches between attached and floating glass states when the page scrolls', async () => {
    let scrollTop = 0
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      get: () => scrollTop,
    })

    const { container } = render(<PublicNavbar />)
    const header = container.querySelector('header')

    expect(header).toHaveAttribute('data-scroll-state', 'attached')

    scrollTop = 120
    fireEvent.scroll(window)
    await waitFor(() => expect(header).toHaveAttribute('data-scroll-state', 'floating'))
    expect(header).toHaveClass('is-scrolled')

    scrollTop = 0
    fireEvent.scroll(window)
    await waitFor(() => expect(header).toHaveAttribute('data-scroll-state', 'attached'))
    expect(header).not.toHaveClass('is-scrolled')
  })

  it('keeps Kegiatan and its child routes out of the primary navigation', () => {
    const { container } = render(<PublicNavbar />)
    const desktopNavigation = container.querySelector('nav[aria-label="Navigasi utama"]')

    expect(desktopNavigation?.querySelector('a[href="/tentang-kami"]')).toBeInTheDocument()
    expect(desktopNavigation?.querySelector('a[href="/publikasi"]')).toBeInTheDocument()
    expect(desktopNavigation?.querySelector('a[href="/galeri"]')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Buka menu Kegiatan' })).not.toBeInTheDocument()
    expect(desktopNavigation?.querySelector('a[href="/program"]')).not.toBeInTheDocument()
    expect(desktopNavigation?.querySelector('a[href="/agenda"]')).not.toBeInTheDocument()
    expect(desktopNavigation?.querySelector('a[href="/kalender"]')).not.toBeInTheDocument()
  })

  it('uses flat mobile links, exposes the join CTA, and closes navigation with Escape', () => {
    const { getByRole, getAllByRole } = render(<PublicNavbar />)
    const menuTrigger = getByRole('button', { name: 'Buka navigasi' })

    fireEvent.click(menuTrigger)
    expect(getByRole('navigation', { name: 'Navigasi mobile' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Program' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Agenda' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Kalender' })).not.toBeInTheDocument()
    expect(getAllByRole('link', { name: /Gabung Bersama Kami/ })).toHaveLength(2)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(getByRole('button', { name: 'Buka navigasi' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps the join CTA separate from the primary navigation list', () => {
    const { container } = render(<PublicNavbar />)
    const desktopNavigation = container.querySelector('nav[aria-label="Navigasi utama"]')
    const joinCta = container.querySelector<HTMLAnchorElement>('a[href="/gabung"]')

    expect(joinCta).toHaveTextContent('Gabung Bersama Kami')
    expect(desktopNavigation?.querySelector('a[href="/gabung"]')).not.toBeInTheDocument()
  })
})
